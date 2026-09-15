// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ `suggestSellPrice` × 1.5 → ceil whole dollar (AUD).
//
// v4 (2026-09-15): PER-PRODUCT CJ LOOKUPS. Instead of one CJ call per variant
// (?variantSku=SKU), we group variants by Shopify product and issue ONE CJ lookup
// per product (using the first variant's SKU). CJ's product/query response already
// contains the full sibling-variant list (variantSku + variantSugSellPrice), so a
// single call resolves the suggested price for every variant in that product.
// This collapses ~76,788 lookups to ~13,817 (the product count). Shopify writes
// remain batched per-product via productVariantsBulkUpdate.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const STATE_KEY = 'reprice-suggest';
const CJ_PAUSE_MS = 1000;      // CJ free tier = 1 req/sec per IP
const MAX_PER_RUN = 60;        // PRODUCTS per run (QPS-bound; each product = 1 CJ call)
const RUN_BUDGET_MS = 55000;   // keep margin under CF ~50s hard limit
const MAX_RETRY = 20000;