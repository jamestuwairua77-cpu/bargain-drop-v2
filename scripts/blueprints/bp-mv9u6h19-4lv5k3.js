javascript
/**
 * Bargain Drop - Clean Zaro Executor
 * Executes requests to Zaro without logging noise or chat text.
 */

const ZARO_API_BASE = process.env.ZARO_API_ENDPOINT || "https://api.zaro.dev/v1";

async function executeZaroTask(taskPayload) {
  const apiKey = process.env.ZARO_API_KEY;

  if (!apiKey) {
    console.error(JSON.stringify({ error: "Missing ZARO_API_KEY env binding" }));
    process.exit(1);
  }

  try {
    const response = await fetch(`${ZARO_API_BASE}/execute`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskPayload)
    });

    const data = await response.json();
    
    // Output strictly clean JSON to prevent text echoing
    console.log(JSON.stringify({ success: response.ok, status: response.status, data }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

// Example execution hook
const payload = {
  store: "bargain-drop.online",
  pipeline: "CIP",
  action: "run_repricer"
};

executeZaroTask(payload);