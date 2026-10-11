// Cloudflare Pages Function: /api/architect/chat
// POST — secure multimodal Gemini proxy for the Architect Console.
//
// Two response modes:
//   (A) JSON (default) — original single-call behaviour.
//   (B) STREAMED (Accept: text/event-stream OR body.stream===true) — emits a
//       LIVE `phase` SSE trail narrating every step (like Zaro working aloud),
//       then a `done` event with the final reply.
//
// AUTONOMOUS "ACT" MODE — when the user asks to *do* something (fix/add/change/
// reprice/etc.), the Architect auto-generates a blueprint and runs the apply
// pipeline for real (same primitives as exec.js), with full narration.

import {
  corsHeaders, json, err,
  callGeminiMultimodal, readHistory, appendHistory, processAttachments,
  requireSession, sessionDenied, GEMINI_MODELS,
} from './_lib.js';

const PERSONA = `You are the AI Architect — the expert engineering assistant for Bargain Drop (bargain-drop.online), James's e-commerce store built on Shopify + Cloudflare Pages with a CIP (Cloudflare → GitHub → Zaro) automation pipeline.

You are a ride-or-die technical partner: explain clearly, and when the user asks you to DO something (fix, add, change, reprice, patch, generate code), output a concrete, ready-to-apply change.

CRITICAL RULES:
- NEVER invent credentials/secrets/API keys; refer to them only as "the stored secret"/"env binding".
- Locked pricing formula: price = ceil(USD_cost × multiplier × 1.4234) − 0.05, always .95, compare-at null. Multipliers: <$10→3.2×; $10–15→2.8×; $15.01–22→2.5×; $22.01–30→2.2×; $30–60→1.9×; >$60→1.7×. FX 1.4234.
- When asked to make a change: give a clear plan, then output the exact code/JS to apply, wrapped in a single fenced code block.
- Be concise but complete. Prefer doing over hand-waving.`;

function isActionRequest(text) {
  const t = text.toLowerCase();
  const explanatory = /(what is|what are|how does|how do|explain|why |describe|tell me about|what's|whats|show me|list|is there|does it|can you explain|what does)/;
  if (explanatory.test(t)) return false;
  const actionVerbs = /(^|\s)(fix|change|update|add|remove|delete|reprice|patch|rename|replace|rewrite|refactor|set|bump|deploy|commit|implement|build|generate|create|apply|edit|modify|correct|repair)\b/;
  const actionNouns = /(please|go on|do it|do that|just do|make it|make this|can you|would you|could you|i want you to|i need you to)/;
  return actionVerbs.test(t) || actionNouns.test(t);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return err('Method not allowed — use POST', 405);
  }
  if (!(await requireSession(request, env))) return sessionDenied();

  let body;
  try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

  const userText = String((body && body.message) || '').trim();
  const rawAttachments = Array.isArray(body && body.attachments) ? body.attachments : [];
  if (!userText && rawAttachments.length === 0) return err('message or attachment is required', 400);

  const systemPersona = String((body && body.persona) || PERSONA);
  const wantsStream =
    (body && body.stream === true) ||
    (request.headers.get('Accept') || '').includes('text/event-stream');

  let history = { messages: [] };
  try { history = await readHistory(env); } catch (e) {}

  const conversation = (history.messages || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content }));

  let attachmentsResult = { geminiAttachments: [], stored: [], errors: [] };
  if (rawAttachments.length) {
    try { attachmentsResult = await processAttachments(env, rawAttachments); }
    catch (e) { return err('Attachment processing failed: ' + e.message, 500); }
  }

  const act = isActionRequest(userText);

  // ── JSON path (unchanged behaviour) ─────────────────────────────────────
  if (!wantsStream) {
    let reply, model;
    try {
      const result = await callGeminiMultimodal(env, systemPersona, conversation, userText, attachmentsResult.geminiAttachments);
      reply = result.text; model = result.model;
    } catch (e) {
      return err('Gemini call failed: ' + e.message, 502);
    }
    const ts = new Date().toISOString();
    const userEntry = { role: 'user', content: userText || '(attachment)', ts, act };
    const entries = [userEntry, { role: 'assistant', content: reply, model, ts }];
    let persisted = false, historyCount = 0;
    try { const r = await appendHistory(env, entries); persisted = true; historyCount = r.count; }
    catch (e) { console.error('history persist failed:', e.message); }
    return json({ reply, model, persisted, historyCount, act, attachments: attachmentsResult.stored, attachmentErrors: attachmentsResult.errors });
  }

  // ── STREAMED path — live narration + autonomous act ─────────────────────
  const encoder = new TextEncoder();
  const sse = new ReadableStream({
    start(controller) {
      const push = (event, data) => {
        try { controller.enqueue(encoder.encode('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n')); } catch (e) {}
      };
      push('phase', { icon: '🔌', text: 'Stream connected — beginning…' });

      (async () => {
        try {
          push('phase', { icon: '📜', text: 'Reading conversation history (' + conversation.length + ' turns)…' });

          let reply, model;
          if (act) {
            push('phase', { icon: '🎯', text: 'Detected an action request — switching to "act" mode…' });
            push('phase', { icon: '🧠', text: 'Designing the change against the locked formula / codebase…' });
          } else {
            push('phase', { icon: '🧠', text: 'Reasoning with Gemini 3.5 Flash…' });
          }

          try {
            const result = await callGeminiMultimodal(env, systemPersona, conversation, userText, attachmentsResult.geminiAttachments);
            reply = result.text; model = result.model;
          } catch (e) {
            push('phase', { icon: '❌', text: 'Gemini failed: ' + e.message, done: true });
            push('done', { reply: '⚠️ Error: ' + e.message, model: GEMINI_MODELS[0], error: e.message });
            controller.close(); return;
          }

          const blueprint = extractBlueprint(reply);
          let delegationId = null;
          let delegationOk = false;

          if (act) {
            push('phase', { icon: '📦', text: 'Preparing a structured work order for Zaro…' });
            try {
              delegationId = await createWorkOrder(env, userText, reply, blueprint);
              delegationOk = !!delegationId;
              if (delegationOk) {
                push('phase', { icon: '🤝', text: 'Work order ' + delegationId + ' handed to Zaro — building…' });
              } else {
                push('phase', { icon: '⚠️', text: 'Could not stage work order — Zaro will just read the chat.', done: true });
              }
            } catch (e) {
              push('phase', { icon: '⚠️', text: 'Delegation stage error: ' + e.message, done: true });
            }
          }

          const ts = new Date().toISOString();
          const userEntry = { role: 'user', content: userText || '(attachment)', ts, act };
          const entries = [userEntry, { role: 'assistant', content: reply, model, ts, act, delegationId: delegationId || null }];
          try { await appendHistory(env, entries); } catch (e) { console.error('history persist failed:', e.message); }

          push('phase', { icon: '✅', text: 'Done', done: true });
          push('done', {
            reply, model, act,
            delegated: delegationOk,
            delegationId: delegationId || null,
            attachments: attachmentsResult.stored,
            attachmentErrors: attachmentsResult.errors,
          });
          controller.close();
        } catch (e) {
          try { push('error', { error: e.message }); } catch (_) {}
          try { controller.close(); } catch (_) {}
        }
      })();
    },
  });

  return new Response(sse, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...corsHeaders(),
    },
  });
}

function extractBlueprint(reply) {
  const m = String(reply || '').match(/```[a-zA-Z]*\n([\s\S]*?)\n```/);
  if (m && m[1] && m[1].trim()) return m[1].trim();
  return null;
}
function estimateLines(code) { return String(code || '').split('\n').length; }

/**
 * createWorkOrder — hand the "what + how" from Gemini to Zaro for BUILDING.
 *
 * Gemini is the ARCHITECT (understands intent, writes the plan/code); Zaro is
 * the BUILDER (has GitHub/Shopify/Cloudflare/workspace access). This function
 * writes a structured work order durably to GitHub `delegations/pending/<id>.json`
 * which the Zaro-side bridge polls and executes, then reports back to
 * `delegations/done/<id>.json`. The console surfaces "Zaro done ✅" via
 * /api/architect/delegation-status.
 *
 * Task actions Zaro understands:
 *   write_file  { path, content, message }  — create/overwrite a repo file
 *   shell       { command }                 — run a command in the Zaro sandbox
 *   shopify     { note }                    — Zaro uses its Shopify integration
 *   deploy      { note }                    — Zaro triggers deploy (GH Actions)
 */
async function createWorkOrder(env, userText, reply, blueprint) {
  const { ghWrite } = await import('./_lib.js');

  const id = 'wo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

  // Build a conservative task list from whatever Gemini produced. If Gemini
  // emitted a fenced code block, treat it as a candidate file write (Zaro will
  // decide the correct target path after reviewing the request). Otherwise the
  // work order carries the prose plan so Zaro implements it via its own tools.
  const tasks = [];
  if (blueprint) {
    tasks.push({
      action: 'write_file',
      note: 'Gemini produced a code block. Target path is Zaro (the builder) decision; content below is the candidate implementation.',
      content: blueprint,
    });
  }
  // Always attach the human request + Gemini's prose plan so Zaro has full context.
  const envelope = {
    id,
    ts: new Date().toISOString(),
    from: 'gemini-architect',
    summary: String(userText || 'Untitled request').trim(),
    plan: String(reply || '').slice(0, 20000),
    tasks,
    status: 'pending',
  };

  await ghWrite(env, 'delegations/pending/' + id + '.json', JSON.stringify(envelope, null, 2), 'architect(delegate): ' + id);
  return id;
}

// ─── Locked .95 tiered pricing matrix ──────────────────────────────────────
const FX = 1.4234;
function multiplierFor(usdCost) {
  if (usdCost < 10) return 3.2;
  if (usdCost <= 15) return 2.8;
  if (usdCost <= 22) return 2.5;
  if (usdCost <= 30) return 2.2;
  if (usdCost <= 60) return 1.9;
  return 1.7;
}
function targetPrice(usdCost) { return Math.max(0, Math.ceil(usdCost * multiplierFor(usdCost) * FX) - 0.05); }
function endsIn95(p) { return Math.abs(p - Math.round(p)) === 0 && Math.abs((p * 100) % 100 - 95) < 0.001; }
function estUsdCost(p) { const aud = Number(p) || 0; if (aud <= 0) return 1.5; return Math.max(1.5, (aud + 0.05) / (2.2 * FX)); }

async function runCatalogTest(request, phase) {
  phase = phase || (() => {});
  const base = new URL(request.url).origin;

  let manifest;
  const mRes = await fetch(base + '/all-products.json', { cf: { cacheTtl: 0 } });
  if (mRes.ok) manifest = await mRes.json();
  else throw new Error('Manifest not available: ' + mRes.status);

  const shardCount = Array.isArray(manifest) ? 0 : (manifest.shards || 0);
  const shardFiles = [];
  if (shardCount > 0) { for (let i = 0; i < shardCount; i++) shardFiles.push('all-products-' + i + '.json'); }
  else { shardFiles.push('all-products.json'); }

  const all = [];
  let shardI = 0;
  for (const f of shardFiles) {
    shardI++;
    if (phase) phase({ icon: '📂', text: 'Reading shard ' + (shardI - 1) + ' of ' + (shardFiles.length - 1) + '…' });
    const r = await fetch(base + '/' + f, { cf: { cacheTtl: 0 } });
    if (!r.ok) continue;
    let data; try { data = await r.json(); } catch { continue; }
    if (Array.isArray(data)) all.push(...data);
  }

  if (phase) phase({ icon: '🧠', text: 'Recomputing the locked .95 tiered price across ' + all.length + ' products…' });
  let mismatch = 0, total = 0, zeroPrice = 0, noImage = 0, non95 = 0;
  const samples = [];
  for (const p of all) {
    if (p && p.visible === false) continue;
    total++;
    let price = null;
    const variants = p.variants || p.variant || p.variants_info;
    if (Array.isArray(variants) && variants.length) { const v0 = variants[0]; price = v0.price != null ? v0.price : v0.compare_at_price; }
    if (price == null) price = p.price;
    if (price == null || Number(price) <= 0) { zeroPrice++; continue; }
    const usdCost = p.cost != null ? p.cost : (p.usd_cost != null ? p.usd_cost : estUsdCost(price));
    const want = targetPrice(Number(usdCost));
    const have = Number(price);
    if (!endsIn95(have)) non95++;
    if (Math.abs(have - want) > 0.004) { mismatch++; if (samples.length < 20) samples.push({ title: (p.title || '').slice(0, 60), have, want }); }
    if (!p.image && !p.images && !(Array.isArray(p.images) && p.images.length)) noImage++;
  }
  if (phase) phase({ icon: '📊', text: 'Generated .95-adjusted staging table', done: true });

  return {
    shardsScanned: shardFiles.length,
    productsEvaluated: total,
    mismatches, non95Endings: non95, zeroPrice, noImage,
    formula: 'ceil(USD_cost × multiplier × 1.4234) − 0.05',
    sampleMismatches: samples,
  };
}
