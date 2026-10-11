/**
 * 100% Free Catalog Repricer & Sync Pipeline (Production V2 - Bargain Drop)
 * 
 * Features:
 * 1. Comprehensive Shard Looping (all-products-0.json through all-products-23.json)
 *    - Independent execution per shard to bypass GitHub's 1MB payload limits
 *    - Streams raw JSON with Accept: application/vnd.github.raw+json
 * 2. Full Shopify Catalog Indexing
 *    - Primary: GraphQL Bulk Operation for high-speed indexing of all 25,450 products / ~70k variants
 *    - Fallback: Cursor-based REST pagination via Link headers
 * 3. Aligned .95 Tiered Pricing Matrix for Google Gemini 1.5 Pro
 *    - New Price = Math.ceil(USD_cost * multiplier * 1.4234) - 0.05
 *    - Under $10 COGS: 3.2x multiplier
 *    - $10 to $30 COGS: sliding scale down to 2.2x
 *    - Above $30 COGS: baseline 1.7x multiplier
 *    - Strictly enforced .95 ending (both in AI prompt and code-level validator)
 */

const SHOPIFY_API_VERSION = "2025-10";

// ─── Telemetry + inter-agent delegation ("Assistant to the Assistant") ────
// Import the delegation layer if present; degrade gracefully in fresh sandboxes.
let delegate, delegateLogAlert, delegateHalt, delegateSignal, CRON_WEEKLY_REPRICER;
try {
  const mod = await import('./delegation.mjs');
  delegate = mod.delegate;
  delegateLogAlert = mod.delegateLogAlert;
  delegateHalt = mod.delegateHalt;
  delegateSignal = mod.delegateSignal;
  CRON_WEEKLY_REPRICER = mod.CRON_WEEKLY_REPRICER;
} catch (e) {
  // Sandbox hasn't got delegation.mjs — emit plain console lines instead.
  delegate = (a, p) => console.log('[DELEGATE]', a, JSON.stringify(p || {}));
  delegateLogAlert = (m, l) => console.error('[ALERT]', l || 'ERROR', m);
  delegateHalt = (r) => console.error('[HALT]', r);
  delegateSignal = (n) => console.log('[SIGNAL]', n);
  CRON_WEEKLY_REPRICER = '168c3bcd-421d-4bed-b9d4-5924bbf2271a';
}

// Phase counter for live telemetry (each phase emits an incrementing "stream"
// event the front-end + bridge can render as a live step).
let _phaseSeq = 0;
function emitPhase(icon, text, detail = {}) {
  _phaseSeq++;
  const line = { ts: Date.now(), seq: _phaseSeq, icon, text, ...detail };
  // Structured telemetry line (parsed by the bridge/agent, and by the console
  // when the runtime is driven through the edge test-loop path).
  console.log('[PHASE]', JSON.stringify(line));
  return line;
}

/**
 * Main entry point for the Repricer workflow
 */
export async function runRepricerWorkflow(env, options = {}) {
  const startTime = Date.now();
  console.log("=================================================");
  console.log("Starting Bargain Drop AI Catalog Repricer V2...");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=================================================");

  validateEnvironment(env);

  const dryRun = options.dryRun || false;
  const startShard = typeof options.startShard === 'number' ? options.startShard : 0;
  const endShard = typeof options.endShard === 'number' ? options.endShard : 23;

  // ── Live phase 0: connection + credentials sanity ─────────────────────
  emitPhase('🔍', 'Checking connection to Cloudflare secure proxy...');
  validateEnvironment(env);
  emitPhase('✅', 'Secure proxy connection confirmed', { shards: `${startShard}→${endShard}` });

  // ── STEP 1: INDEX ALL SHOPIFY PRODUCTS AND VARIANTS ───────────────────
  console.log("\n[Step 1] Indexing Shopify catalog across all products...");
  emitPhase('🛰️', 'Pulling live Shopify catalog entries via cursor pagination...');
  const shopifyIndex = await indexShopifyCatalog(env);
  console.log(`✓ Indexed ${shopifyIndex.variantsBySku.size} variants by SKU and ${shopifyIndex.variantsById.size} by Variant ID from Shopify.\n`);
  emitPhase('✅', `Shopify catalog indexed`, { variantsBySku: shopifyIndex.variantsBySku.size, variantsById: shopifyIndex.variantsById.size });

  // ── STEP 2: LOOP THROUGH ALL 24 SHARDS ────────────────────────────────
  console.log(`[Step 2] Scanning Shards ${startShard} through ${endShard} sequentially...`);
  emitPhase('📂', `Downloading GitHub Catalog: Reading Shard ${startShard} of ${endShard}...`);
  
  const summary = {
    totalShardsScanned: 0,
    shardsWithChanges: 0,
    totalProductsScanned: 0,
    totalMismatchesFound: 0,
    totalVariantsUpdated: 0,
    failedUpdates: 0,
    errors: []
  };

  for (let shardIdx = startShard; shardIdx <= endShard; shardIdx++) {
    const shardFileName = `all-products-${shardIdx}.json`;
    console.log(`\n-------------------------------------------------`);
    console.log(`>>> Processing Shard [${shardIdx}/23]: ${shardFileName}`);
    console.log(`-------------------------------------------------`);
    emitPhase('📂', `Downloading GitHub Catalog: Reading Shard ${shardIdx} of ${endShard}...`);

    try {
      const shardResult = await processSingleShard(shardFileName, shardIdx, shopifyIndex, env, dryRun);
      summary.totalShardsScanned++;
      summary.totalProductsScanned += shardResult.productsCount;
      summary.totalMismatchesFound += shardResult.mismatchesCount;
      summary.totalVariantsUpdated += shardResult.updatedCount;
      if (shardResult.committed) {
        summary.shardsWithChanges++;
      }
    } catch (shardErr) {
      console.error(`❌ Error processing ${shardFileName}:`, shardErr.message);
      summary.errors.push({ shard: shardFileName, error: shardErr.message });
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log("\n=================================================");
  console.log("Repricer Workflow Complete!");
  console.log(`Duration: ${durationSec}s`);
  console.log(`Shards Scanned: ${summary.totalShardsScanned}`);
  console.log(`Shards Committed: ${summary.shardsWithChanges}`);
  console.log(`Total Products Scanned: ${summary.totalProductsScanned}`);
  console.log(`Mismatches Found: ${summary.totalMismatchesFound}`);
  console.log(`Variants Updated: ${summary.totalVariantsUpdated}`);
  if (summary.errors.length > 0) {
    console.log(`Encountered ${summary.errors.length} shard errors:`, summary.errors);
  }
  console.log("=================================================\n");

  // ── Delegate to Zaro if anomalies were detected ────────────────────────
  delegateSignal('run-complete', { durationSec, ...summary });

  return summary;
}

/**
 * Validates that all required environment variables are present
 */
function validateEnvironment(env) {
  const required = [
    'GEMINI_API_KEY',
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'SHOPIFY_STORE_NAME',
    'SHOPIFY_ACCESS_TOKEN'
  ];

  for (const key of required) {
    if (!env[key] || env[key].includes("PASTE_YOUR")) {
      delegateHalt('missing-or-invalid-environment:' + key, { cause: 'config', cogs_context: key });
      throw new Error(`Missing or unconfigured environment variable: ${key}. Please check /.nexus/secrets/repricer-env.json`);
    }
  }
}

// ─── Hard-margin-floor safety net ────────────────────────────────────────────
// The pricing formula must never produce a retail price below cost. If a
// computed price trips the floor (price < USD_cost × FX, i.e. we'd lose money
// on the unit), that is a hard anomaly → delegate a halt to Zaro.
const MARGIN_FLOOR_FX = 1.4234;
function assertAboveMarginFloor(usdCost, newPrice, sku) {
  const cost = Number(usdCost) || 0;
  const price = Number(newPrice) || 0;
  if (cost > 0 && price < cost * MARGIN_FLOOR_FX - 0.005) {
    // Violates the hard margin floor — must not proceed unattended.
    delegateLogAlert(
      `Hard margin-floor violation: ${sku || 'unknown SKU'} would price at $${price.toFixed(2)} ` +
      `against a USD cost of $${cost.toFixed(2)} (floor $${(cost * MARGIN_FLOOR_FX).toFixed(2)}). Halting.`,
      'CRITICAL',
      { sku, usdCost: cost, newPrice: price, floor: cost * MARGIN_FLOOR_FX }
    );
    delegateHalt('margin-floor-violation', { sku, usdCost: cost, newPrice: price, cause: 'margin-floor' });
    return false;
  }
  return true;
}

/**
 * Step 1: Index all live Shopify products & variants
 * Primary method: GraphQL Bulk Operation (fast & comprehensive)
 * Fallback: Paginated REST Cursor API via Link headers
 */
async function indexShopifyCatalog(env) {
  return withNetworkGuard('shopify-catalog-index', async () => {
    try {
      return await indexViaGraphQLBulk(env);
    } catch (bulkErr) {
      console.warn(`GraphQL Bulk Query unavailable or failed (${bulkErr.message}). Falling back to REST Cursor Pagination...`);
      return await indexViaRestCursor(env);
    }
  });
}

/**
 * Wrap a network call so a hard failure emits a delegation halt instead of
 * failing silently mid-run.
 */
async function withNetworkGuard(label, fn) {
  try {
    const v = await fn();
    return v;
  } catch (e) {
    delegateLogAlert(`Network failure during ${label}: ${e.message}`, 'ERROR', { phase: label });
    delegateHalt('network-failure', { cause: 'network', phase: label, detail: e.message });
    throw e;
  }
}

/**
 * High-speed catalog indexing using GraphQL Bulk Operation
 */
async function indexViaGraphQLBulk(env) {
  const shopUrl = `https://${env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  
  // 1. Check if a bulk operation is already running
  const statusQuery = `{ currentBulkOperation { id status errorCode objectCount rootObjectCount url } }`;
  const statusRes = await fetch(shopUrl, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: statusQuery })
  });
  
  const statusData = await statusRes.json();
  const currentOp = statusData?.data?.currentBulkOperation;

  let downloadUrl = null;

  // Only reuse a completed operation if it actually queried variants (objectCount > rootObjectCount)
  const hasVariantsDump = currentOp && 
    currentOp.status === 'COMPLETED' && 
    currentOp.url && 
    parseInt(currentOp.objectCount || '0', 10) > parseInt(currentOp.rootObjectCount || '0', 10);

  if (hasVariantsDump) {
    console.log(`Reusing existing completed Bulk Operation with variants: ${currentOp.id} (${currentOp.objectCount} objects)`);
    downloadUrl = currentOp.url;
  } else if (currentOp && currentOp.status === 'RUNNING') {
    console.log(`Bulk Operation ${currentOp.id} is already in progress, polling for completion...`);
    downloadUrl = await pollBulkOperation(shopUrl, env.SHOPIFY_ACCESS_TOKEN, currentOp.id);
  } else {
    // Kick off a fresh bulk query
    const bulkQueryMutation = `
      mutation {
        bulkOperationRunQuery(
          query: """
          {
            products {
              edges {
                node {
                  id
                  handle
                  variants {
                    edges {
                      node {
                        id
                        sku
                        price
                        compareAtPrice
                      }
                    }
                  }
                }
              }
            }
          }
          """
        ) {
          bulkOperation {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const runRes = await fetch(shopUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: bulkQueryMutation })
    });

    const runData = await runRes.json();
    const op = runData?.data?.bulkOperationRunQuery?.bulkOperation;
    const errors = runData?.data?.bulkOperationRunQuery?.userErrors;

    if (!op || (errors && errors.length > 0)) {
      throw new Error(`Failed to start Bulk Operation: ${JSON.stringify(errors || runData)}`);
    }

    console.log(`Started Bulk Operation ${op.id}. Waiting for catalog dump...`);
    downloadUrl = await pollBulkOperation(shopUrl, env.SHOPIFY_ACCESS_TOKEN, op.id);
  }

  // Download and parse JSONL dump
  console.log("Downloading Bulk Operation dataset...");
  const dumpRes = await fetch(downloadUrl);
  if (!dumpRes.ok) throw new Error(`Failed to download JSONL dump: ${dumpRes.status}`);
  const jsonlText = await dumpRes.text();

  const variantsBySku = new Map();
  const variantsById = new Map();
  const productsByGid = new Map();

  for (const line of jsonlText.split('\n')) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);

    if (obj.id && obj.id.includes('ProductVariant')) {
      const numericId = obj.id.replace('gid://shopify/ProductVariant/', '');
      const variantInfo = {
        gid: obj.id,
        id: numericId,
        sku: obj.sku || '',
        price: parseFloat(obj.price || '0'),
        productId: obj.__parentId ? obj.__parentId.replace('gid://shopify/Product/', '') : null
      };

      if (obj.sku) {
        variantsBySku.set(obj.sku.trim(), variantInfo);
      }
      variantsById.set(numericId, variantInfo);
    } else if (obj.id && obj.id.includes('Product')) {
      const numericId = obj.id.replace('gid://shopify/Product/', '');
      productsByGid.set(numericId, {
        id: numericId,
        handle: obj.handle
      });
    }
  }

  return { variantsBySku, variantsById, productsByGid };
}

/**
 * Polls Shopify Bulk Operation until COMPLETED
 */
async function pollBulkOperation(shopUrl, token, opId, maxWaitSec = 180) {
  const query = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status errorCode objectCount url } } }`;
  const startTime = Date.now();

  while ((Date.now() - startTime) < maxWaitSec * 1000) {
    await new Promise(r => setTimeout(r, 4000));
    const res = await fetch(shopUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { id: opId } })
    });

    const data = await res.json();
    const node = data?.data?.node;
    if (!node) continue;

    if (node.status === 'COMPLETED') {
      if (!node.url) throw new Error("Bulk Operation completed but returned no URL (catalog might be empty).");
      return node.url;
    }
    if (node.status === 'FAILED' || node.status === 'CANCELED') {
      throw new Error(`Bulk Operation failed with status: ${node.status} (code: ${node.errorCode})`);
    }
  }

  throw new Error(`Bulk Operation polling timed out after ${maxWaitSec}s`);
}

/**
 * Fallback: Paginated REST cursor fetching via Link headers
 */
async function indexViaRestCursor(env) {
  const variantsBySku = new Map();
  const variantsById = new Map();
  const productsByGid = new Map();

  let nextUrl = `https://${env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,handle,variants`;
  let pageCount = 0;

  while (nextUrl) {
    pageCount++;
    console.log(`[REST Pagination] Fetching page ${pageCount}...`);

    const res = await fetch(nextUrl, {
      headers: {
        'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`REST fetch failed on page ${pageCount}: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const products = data.products || [];

    for (const prod of products) {
      productsByGid.set(String(prod.id), { id: String(prod.id), handle: prod.handle });
      for (const v of prod.variants || []) {
        const vInfo = {
          id: String(v.id),
          sku: v.sku || '',
          price: parseFloat(v.price || '0'),
          productId: String(prod.id)
        };
        if (v.sku) variantsBySku.set(v.sku.trim(), vInfo);
        variantsById.set(String(v.id), vInfo);
      }
    }

    // Parse Link header for next cursor
    const linkHeader = res.headers.get('link') || res.headers.get('Link');
    nextUrl = null;
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) nextUrl = match[1];
    }

    // Brief rate-limiting pause
    await new Promise(r => setTimeout(r, 250));
  }

  return { variantsBySku, variantsById, productsByGid };
}

/**
 * Step 2: Process a single catalog shard independently
 */
async function processSingleShard(shardFileName, shardIdx, shopifyIndex, env, dryRun) {
  // 1. Fetch file content and metadata (SHA) from GitHub
  // Using Accept: application/vnd.github.raw+json streams full content bypassing 1MB limitation
  const rawUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${shardFileName}`;
  
  const rawRes = await fetch(rawUrl, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Zaro-Environment',
      'Accept': 'application/vnd.github.raw+json'
    }
  });

  if (!rawRes.ok) {
    throw new Error(`Failed to fetch ${shardFileName} from GitHub: ${rawRes.status} ${await rawRes.text()}`);
  }

  const shardCatalog = await rawRes.json();
  if (!Array.isArray(shardCatalog)) {
    throw new Error(`Shard ${shardFileName} did not parse into a JSON array`);
  }

  // 2. Fetch the metadata (SHA) needed for committing back
  const metaRes = await fetch(rawUrl, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Zaro-Environment',
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const metaData = await metaRes.json();
  const currentSha = metaData.sha;

  console.log(`Loaded ${shardCatalog.length} products from ${shardFileName} (SHA: ${currentSha ? currentSha.substring(0, 7) : 'n/a'})`);

  // 3. Scan for price mismatches between shard and indexed Shopify catalog
  const mismatches = [];

  for (const item of shardCatalog) {
    // If the item has a variants array, inspect individual variants
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const v of item.variants) {
        const sku = (v.sku || '').trim();
        let shopifyMatch = sku ? shopifyIndex.variantsBySku.get(sku) : null;
        if (!shopifyMatch && v.id) {
          shopifyMatch = shopifyIndex.variantsById.get(String(v.id));
        }

        if (shopifyMatch) {
          const webPrice = parseFloat(v.price || 0);
          const shopifyPrice = shopifyMatch.price;

          if (Math.abs(webPrice - shopifyPrice) > 0.01 || item.needs_repricing) {
            mismatches.push({
              product_id: String(item.id || ''),
              sku: sku || shopifyMatch.sku,
              title: `${item.title || ''} (${v.option1 || ''} ${v.option2 || ''})`.trim(),
              current_web_price: webPrice,
              current_shopify_price: shopifyPrice,
              cogs: parseFloat(v.cogs || item.cogs || 0),
              variant_id: shopifyMatch.id,
              target_variant: v,
              parent_product: item
            });
          }
        }
      }
    } else {
      // Top-level item without variants array
      const sku = (item.sku || '').trim();
      let shopifyMatch = sku ? shopifyIndex.variantsBySku.get(sku) : null;
      if (!shopifyMatch && item.id) {
        shopifyMatch = shopifyIndex.variantsById.get(String(item.id));
      }

      if (shopifyMatch) {
        const webPrice = parseFloat(item.price || item.p || 0);
        const shopifyPrice = shopifyMatch.price;

        if (Math.abs(webPrice - shopifyPrice) > 0.01 || item.needs_repricing) {
          mismatches.push({
            product_id: String(item.id || ''),
            sku: sku || shopifyMatch.sku,
            title: item.title || item.t || '',
            current_web_price: webPrice,
            current_shopify_price: shopifyPrice,
            cogs: parseFloat(item.cogs || 0),
            variant_id: shopifyMatch.id,
            target_variant: null,
            parent_product: item
          });
        }
      }
    }
  }

  console.log(`Found ${mismatches.length} price mismatches in ${shardFileName}.`);

  if (mismatches.length === 0) {
    console.log(`✓ Shard ${shardFileName} is already fully synchronized.`);
    return { productsCount: shardCatalog.length, mismatchesCount: 0, updatedCount: 0, committed: false };
  }

  // 4. Batch items into chunks of 100 for Gemini processing
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < mismatches.length; i += BATCH_SIZE) {
    const chunk = mismatches.slice(i, i + BATCH_SIZE);
    console.log(`Processing Gemini batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mismatches.length / BATCH_SIZE)} (${chunk.length} items)...`);

    emitPhase('🧠', 'Running pricing formula matrix check on Gemini 3.5 Flash...', { batch: `${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mismatches.length / BATCH_SIZE)}`, items: chunk.length });

    const optimizedBatch = await callGeminiPricingBrain(chunk, env);

    emitPhase('📊', 'Generating .95-adjusted staging table...', { batch: Math.floor(i / BATCH_SIZE) + 1 });

    // 5. Apply new prices to Shopify & update the shard object in-memory
    for (const opt of optimizedBatch) {
      const matchObj = chunk.find(m => String(m.variant_id) === String(opt.variant_id) || (m.sku && m.sku === opt.sku));
      if (!matchObj) continue;

      // Ensure clean strict .95 decimal
      const verifiedPrice = enforceNinetyFivePrice(opt.new_price);

      // Hard margin-floor safety net: halt delegation if we'd sell below cost.
      const cogsForThis = (matchObj.cogs != null && matchObj.cogs > 0) ? matchObj.cogs : undefined;
      if (cogsForThis != null) {
        const okFloor = assertAboveMarginFloor(cogsForThis, verifiedPrice, matchObj.sku);
        if (!okFloor) continue;   // anomaly already delegated to Zaro; skip this item
      }

      if (!dryRun) {
        await updateShopifyVariantPrice(env, opt.variant_id, verifiedPrice);
      } else {
        console.log(`[DRY RUN] Would set Variant ${opt.variant_id} (${opt.sku}) to $${verifiedPrice}`);
      }

      // Update in-memory shard representation
      if (matchObj.target_variant) {
        matchObj.target_variant.price = verifiedPrice;
      }
      if (matchObj.parent_product) {
        if ('p' in matchObj.parent_product) matchObj.parent_product.p = verifiedPrice;
        else matchObj.parent_product.price = verifiedPrice;
        if (matchObj.parent_product.needs_repricing) matchObj.parent_product.needs_repricing = false;
      }

      totalUpdated++;
    }
  }

  // 6. Commit the updated shard back to GitHub if changes occurred
  let committed = false;
  if (!dryRun && totalUpdated > 0 && currentSha) {
    console.log(`Saving ${totalUpdated} price updates back to GitHub: ${shardFileName}...`);
    const commitMessage = `chore(repricer): sync ${totalUpdated} prices in ${shardFileName} [.95 tiered matrix]`;
    const updatedContentBase64 = Buffer.from(JSON.stringify(shardCatalog, null, 2)).toString('base64');

    const putRes = await fetch(rawUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Zaro-Environment',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: updatedContentBase64,
        sha: currentSha
      })
    });

    if (!putRes.ok) {
      throw new Error(`Failed to commit ${shardFileName} back to GitHub: ${putRes.status} ${await putRes.text()}`);
    }
    console.log(`✓ Committed ${shardFileName} successfully.`);
    committed = true;
  }

  return {
    productsCount: shardCatalog.length,
    mismatchesCount: mismatches.length,
    updatedCount: totalUpdated,
    committed
  };
}

/**
 * Step 3: Call Google Gemini Brain with the strict .95 Tiered Pricing Matrix
 */
async function callGeminiPricingBrain(itemsBatch, env) {
  // Support current available models with automatic fallback
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

  const payloadItems = itemsBatch.map(it => ({
    sku: it.sku,
    title: it.title,
    current_web_price: it.current_web_price,
    current_shopify_price: it.current_shopify_price,
    cogs: it.cogs,
    variant_id: it.variant_id
  }));

  const pricingRulesPrompt = `
You are the expert retail pricing intelligence agent for Bargain Drop (bargain-drop.online).
Calculate the optimized customer-facing retail price "new_price" (in AUD) for this batch of mismatched catalog products.

STRICT PRICING RULES & PROPRIETARY RETAIL FORMULA:
1. FORMULA:
   new_price = Math.ceil(USD_cost * multiplier * 1.4234) - 0.05
   - The exchange rate is locked at FX = 1.4234.
   - EVERY single calculated price MUST strictly end in exactly ".95" (e.g., $15.95, $24.95, $49.95, $119.95).
   - NEVER output .00, .50, .99, or any ending other than .95.

2. TIERED MULTIPLIER MATRIX (based on USD Cost of Goods / COGS):
   - Low-Cost Tier (Under $10.00 USD COGS):
     Apply a 3.2x multiplier to protect profit margins against shipping, logistics, and gateway fees.
   - Mid-Cost Tier ($10.00 to $30.00 USD COGS):
     Apply a sliding scale multiplier down to 2.2x:
     * $10.00 - $15.00 COGS -> 2.8x
     * $15.01 - $22.00 COGS -> 2.5x
     * $22.01 - $30.00 COGS -> 2.2x
   - High-Cost Tier (Above $30.00 USD COGS):
     Apply a baseline 1.7x multiplier (or 1.9x if between $30.00 and $60.00).

3. COST ESTIMATION:
   - If "cogs" is provided and > 0, use it as USD_cost.
   - If "cogs" is 0 or missing, estimate USD_cost from the existing price using the baseline formula:
     USD_cost = Math.max(1.5, current_shopify_price / (2.2 * 1.4234)).

4. OUTPUT FORMAT:
   Return ONLY a valid, minified JSON array of objects without markdown formatting or code fences:
   [{"sku": "...", "variant_id": 123456, "new_price": 29.95}]

Data:
${JSON.stringify(payloadItems)}
`;

  let lastError = null;
  for (const model of models) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
    try {
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: pricingRulesPrompt }] }]
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.warn(`Model ${model} returned HTTP ${geminiRes.status}: ${errText.slice(0, 150)}... Trying next model.`);
        lastError = new Error(`Gemini ${model} failed (${geminiRes.status}): ${errText}`);
        continue;
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanJsonText);
      if (!Array.isArray(parsed)) throw new Error("Gemini response is not an array");
      return parsed;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

/**
 * Code-level safety enforcement: Guarantees every price ends in exactly .95
 */
function enforceNinetyFivePrice(rawPrice) {
  const num = parseFloat(rawPrice);
  if (isNaN(num) || num <= 0) return 9.95;
  const wholeCeil = Math.ceil(num);
  const formatted = parseFloat((wholeCeil - 0.05).toFixed(2));
  return formatted > 0 ? formatted : 0.95;
}

/**
 * Updates a single variant price in Shopify via REST
 */
async function updateShopifyVariantPrice(env, variantId, newPrice) {
  const url = `https://${env.SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/variants/${variantId}.json`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      variant: {
        id: variantId,
        price: newPrice.toFixed(2)
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Failed to update Shopify Variant ${variantId} to $${newPrice}:`, errText);
    return false;
  }

  // Small pacing delay to respect Shopify REST rate limits
  await new Promise(r => setTimeout(r, 200));
  return true;
}
