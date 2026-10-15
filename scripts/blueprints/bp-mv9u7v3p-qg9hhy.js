javascript
/**
 * Bargain Drop - Zaro CIP Execution Script
 * Pipelines GitHub Shards -&gt; Pricing Calculation -&gt; Shopify GraphQL
 */

const CONFIG = {
  BATCH_LIMIT: 50, // Circuit breaker: prevents credit drain loops
  FX_RATE: 1.4234
};

function calculatePrice(usdCost) {
  let multiplier;
  if (usdCost &lt; 10.00) {
    multiplier = 3.2;
  } else if (usdCost &lt;= 15.00) {
    multiplier = 2.8;
  } else if (usdCost &lt;= 22.00) {
    multiplier = 2.5;
  } else if (usdCost &lt;= 30.00) {
    multiplier = 2.2;
  } else if (usdCost &lt;= 60.00) {
    multiplier = 1.9;
  } else {
    multiplier = 1.7;
  }

  const rawPrice = usdCost * multiplier * CONFIG.FX_RATE;
  const finalPrice = (Math.ceil(rawPrice) - 0.05).toFixed(2);

  return {
    price: finalPrice,
    compareAtPrice: null
  };
}

async function runZaroRepricer() {
  const githubToken = process.env.GITHUB_TOKEN; // env binding
  const githubRepo = process.env.GITHUB_REPO;   // env binding
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN; // env binding
  const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN;  // env binding

  const stats = { scanned: 0, updated: 0, limited: false, errors: [] };

  try {
    const shardListRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/shards`, {
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "User-Agent": "BargainDrop-Zaro-Runner"
      }
    });

    if (!shardListRes.ok) {
      throw new Error(`GitHub fetch failed: ${shardListRes.statusText}`);
    }

    const shardFiles = await shardListRes.json();

    for (const file of shardFiles) {
      if (!file.name.endsWith('.json')) continue;

      const contentRes = await fetch(file.download_url);
      const items = await contentRes.json();

      for (const item of items) {
        if (stats.scanned &gt;= CONFIG.BATCH_LIMIT) {
          stats.limited = true;
          break;
        }

        stats.scanned++;
        const target = calculatePrice(item.cost_usd);

        if (item.shopify_variant_id) {
          const updated = await updateShopifyVariant(
            shopifyDomain,
            shopifyToken,
            item.shopify_variant_id,
            target.price,
            target.compareAtPrice
          );
          if (updated) stats.updated++;
        }
      }

      if (stats.limited) break;
    }
  } catch (err) {
    stats.errors.push(err.message);
  }

  return stats;
}

async function updateShopifyVariant(domain, token, variantId, price, compareAtPrice) {
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

  const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify({
      query,
      variables: {
        input: { id: variantId, price, compareAtPrice }
      }
    })
  });

  const body = await res.json();
  const errors = body?.data?.productVariantUpdate?.userErrors;
  return (!errors || errors.length === 0);
}

// Execute and write clean JSON output
runZaroRepricer().then(results =&gt; {
  process.stdout.write(JSON.stringify(results, null, 2) + "\n");
});