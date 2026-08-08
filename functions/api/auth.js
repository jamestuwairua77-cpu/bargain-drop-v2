// Cloudflare Pages Function: /api/auth
// POST { action: "register"|"signin", email, password, name? }

import { corsHeaders, hashPassword, verifyPassword } from '../_sync-lib.js';
import { ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 5;

// Simple in-memory rate limiter (per worker instance)
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + RATE_LIMIT_WINDOW; }
  record.count++;
  rateLimitMap.set(ip, record);
  return record.count <= RATE_LIMIT_MAX;
}

function createSession(userId, env) {
  const token = crypto.randomUUID();
  // In production, you'd store session in KV. For now, return a simple token.
  return { token, userId, expiresIn: 86400 };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const body = await request.json().catch(() => ({}));
  const { action, email, password, name } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Load users
  let users = [];
  try {
    const existing = await ghRead(env, USERS_PATH);
    if (existing && existing.content) {
      users = JSON.parse(atob(existing.content));
    }
  } catch (e) {
    // First run — start empty
  }

  if (action === 'register') {
    const exists = users.find(u => u.email === email);
    if (exists) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const hashed = await hashPassword(password);
    const userId = 'u-' + Date.now();
    const user = { id: userId, email, name: name || email.split('@')[0], password: hashed, provider: 'email', createdAt: new Date().toISOString() };
    users.push(user);

    const existing = await ghRead(env, USERS_PATH);
    await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: register user', existing?.sha);

    const session = createSession(userId, env);
    return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email, name: user.name }, session }), {
      status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  if (action === 'signin') {
    const user = users.find(u => u.email === email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const session = createSession(user.id, env);
    return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email, name: user.name }, session }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action. Use register or signin.' }), {
    status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
