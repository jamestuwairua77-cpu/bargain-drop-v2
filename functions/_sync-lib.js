// Shared helpers for CJ↔Shopify sync — Cloudflare Workers edition.
// All Node.js built-ins (fs, crypto, Buffer) replaced with Web APIs.

// ─── Environment ──────────────────────────────────────────────────────────────
// In Cloudflare Pages Functions, env vars are accessed via context.env
// This module receives env when called from the handler.

import { getShopifyToken, invalidateShopifyToken } from './_shopify-token.js';