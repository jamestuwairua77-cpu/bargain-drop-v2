javascript
/**
 * Bargain Drop - Automated Repricer Worker (Emergency Patched)
 * CIP Pipeline: GitHub Shards -&gt; Price Calculation -&gt; Shopify GraphQL API
 */

const CONFIG = {
  // EMERGENCY KILL SWITCH: Set to false to completely block all Zaro/API executions
  ACTIVE: false, 
  MAX_ITEMS_PER_RUN: 50 // Safety cap to prevent runaway token/credit consumption
};

export default {
  async scheduled(event, env, ctx) {
    if (!CONFIG.ACTIVE) {
      console.warn("Repricer aborted: EMERGENCY KILL SWITCH IS ACTIVE.");
      return;
    }
    ctx.waitUntil(runRepricer(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/run" &amp;&amp; request.method === "POST") {
      if (!CONFIG.ACTIVE) {
        return new Response(JSON.stringify({ 
          status: "blocked", 
          message: "Execution halted. Emergency kill switch CONFIG.ACTIVE is set to false." 
        }), { status: 403, headers: { "Content-Type": "application/json" } });
      }

      const summary = await runRepricer(env);
      return new Response(JSON.stringify(summary, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(`Bargain Drop Repricer Worker active. Status: ${CONFIG.ACTIVE ? 'RUNNING' : 'HALTED (Emergency Stop)'}`, { status: 200 });
  }
};

function calculatePrice(usdCost) {
  let multiplier;
  if (usdCost &lt; 10.00) multiplier = 3.2;
  else if (usdCost &lt;= 15.00) multiplier = 2.8;
  else if (usdCost &lt;= 22.00) multiplier = 2.5;
  else if (usdCost &lt;= 30.00) multiplier = 2.2;
  else if (usdCost &lt;= 60.00) multiplier = 1.9;
  else multiplier = 1.7;

  const FX_RATE = 1.4234;
  const rawPrice = usdCost * multiplier * FX_RATE;
  const finalPrice = Math.ceil(rawPrice) - 0.05;

  return {
    price: finalPrice.toFixed(2),
    compareAtPrice: null
  };
}

async function runRepricer(env) {
  const stats = { scanned: 0, updated: 0, limitedOut: false, errors: [] };

  try {
    const shardResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/shards`, {
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "BargainDrop-Repricer"
      }
    });

    if (!shardResponse.ok) {
      throw new Error(`GitHub Shards fetch failed: ${shardResponse.statusText}`);
    }

    const shardFiles = await shardResponse.json();

    for (const file of shardFiles) {
      if (!file.name.endsWith('.json')) continue;

      const fileRes = await fetch(file.download_url);
      const items = await fileRes.json();

      for (const item of items) {
        if (stats.scanned &gt;= CONFIG.MAX_ITEMS_PER_RUN) {
          stats.limitedOut = true;
          break;
        }

        stats.scanned++;
        const targetPricing = calculatePrice(item.cost_usd);

        if (item.shopify_variant_id) {
          const updated = await updateShopifyVariant(
            env,
            item.shopify_variant_id,
            targetPricing.price,
            targetPricing.compareAtPrice
          );
          if (updated) stats.updated++;
        }
      }
      if (stats.limitedOut) break;
    }
  } catch (err) {
    stats.errors.push(err.message);
  }

  return stats;
}

async function updateShopifyVariant(env, variantId, price, compareAtPrice) {
  const query = `
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          price
          compareAtPrice
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_TOKEN
    },
    body: JSON.stringify({
      query,
      variables: {
        input: { id: variantId, price, compareAtPrice }
      }
    })
  });

  const resData = await response.json();
  const userErrors = resData?.data?.productVariantUpdate?.userErrors;

  if (userErrors &amp;&amp; userErrors.length &gt; 0) {
    return false;
  }

  return true;
}