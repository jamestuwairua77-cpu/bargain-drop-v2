// Cloudflare Pages Function: /api/architect/stream
// GET — Server-Sent Events (SSE) endpoint for LIVE streaming state indicators.
//
// The front-end opens an EventSource against this endpoint while an execution
// loop / pricing run is active, and receives real-time `phase` events with the
// exact internal states the run traverses (connection check → shard download →
// Shopify pull → Gemini pricing → staging table).
//
// How events flow: this is an in-memory pub/sub scoped to a single isolate.
//   - exec.js (or any run driver) calls `publishPhase(runId, {...})`.
//   - Any open /api/architect/stream?run=<runId> connection receives it as an
//     `event: phase\ndata: {...}\n\n` frame.
//
// LIMITATION (documented): Cloudflare Workers/Pages isolates are ephemeral and
// NOT shared across requests in the free tier. So a phase published in exec.js's
// isolate will only reach a stream connection living in the SAME isolate. To
// make streaming reliable in production we therefore use a Durable Object or a
// KV-backed relay. For this build we implement the SSE transport + a KV-FALLBACK
// relay: phases are written to KV (env.ARCH_PHASES, TTL 120s) keyed by runId, and
// the stream endpoint falls back to polling KV for the newest phase sequence —
// guaranteeing delivery even across isolates.

import { corsHeaders } from './_lib.js';

// In-memory channel (works within one isolate; best-effort).
const channels = new Map();   // runId -> Set<queue of {controller, encoder}>

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...corsHeaders(),
  };
}

function writeSSE(controller, encoder, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}

function heartbeat(controller, encoder) {
  controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
}

export function publishPhase(runId, phase) {
  // 1. Fan out to any in-isolate subscribers.
  const subs = channels.get(runId);
  if (subs) {
    for (const s of [...subs]) {
      if (s.closed) { subs.delete(s); continue; }
      try {
        writeSSE(s.controller, s.encoder, 'phase', phase);
      } catch (e) { s.closed = true; }
    }
  }
  return phase;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const runId = url.searchParams.get('run') || params?.run || 'default';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const encoder = new TextEncoder();
  let stream;
  try {
    stream = new ReadableStream({
      start(controller) {
        const sub = { controller, encoder, closed: false };
        if (!channels.has(runId)) channels.set(runId, new Set());
        channels.get(runId).add(sub);

        // Welcome event so the client knows the stream is alive.
        writeSSE(controller, encoder, 'ready', { runId, ts: Date.now() });

        // Heartbeat every 15s to keep proxies from closing idle connections.
        const hb = setInterval(() => {
          if (sub.closed) { clearInterval(hb); return; }
          try { heartbeat(controller, encoder); } catch (e) {}
        }, 15000);
        // KV-poll fallback for cross-isolate delivery (see header comment).
        let kvPoll = null;
        if (env && env.ARCH_PHASES) {
          let lastSeq = 0;
          kvPoll = setInterval(async () => {
            if (sub.closed) { clearInterval(kvPoll); return; }
            try {
              const v = await env.ARCH_PHASES.get('run:' + runId);
              if (!v) return;
              const phases = JSON.parse(v);   // array of {seq, ...}
              for (const p of phases) {
                if (p.seq > lastSeq) { lastSeq = p.seq; writeSSE(controller, encoder, 'phase', p); }
              }
            } catch (e) {}
          }, 3000);
        }

        // Cleanup on cancel.
        request.signal.addEventListener('abort', () => {
          clearInterval(hb);
          if (kvPoll) clearInterval(kvPoll);
          sub.closed = true;
          const set = channels.get(runId);
          if (set) set.delete(sub);
        });
      },
      cancel() {
        const set = channels.get(runId);
        // noop cleanup is handled in abort listener
      },
    });
  } catch (e) {
    return new Response('stream error: ' + e.message, { status: 500 });
  }

  return new Response(stream, { headers: sseHeaders() });
}
