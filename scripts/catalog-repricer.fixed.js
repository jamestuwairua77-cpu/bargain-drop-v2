javascript
/**
 * Bargain Drop - Zaro Usage &amp; Credit Drain Audit Script
 * Run: ZARO_API_KEY=your_key node audit-zaro-usage.js
 */

const ZARO_API_BASE = process.env.ZARO_API_ENDPOINT || "https://api.zaro.dev/v1"; 

async function auditZaroUsage() {
  const apiKey = process.env.ZARO_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: Missing ZARO_API_KEY environment variable.");
    process.exit(1);
  }

  console.log("🔍 Fetching Zaro usage telemetry and execution logs...\n");

  try {
    // 1. Fetch usage breakdown
    const response = await fetch(`${ZARO_API_BASE}/usage/logs?limit=100`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Zaro API returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const logs = data.logs || data.executions || [];

    if (logs.length === 0) {
      console.log("ℹ️ No recent execution logs found.");
      return;
    }

    // 2. Aggregate metrics by action/endpoint
    const summary = {};

    logs.forEach((log) =&gt; {
      const key = log.action || log.endpoint || log.task_name || "unknown_task";
      const credits = log.credits_used || log.cost || 1;

      if (!summary[key]) {
        summary[key] = { invocations: 0, totalCredits: 0, lastRun: log.timestamp || "N/A" };
      }

      summary[key].invocations += 1;
      summary[key].totalCredits += credits;
    });

    // 3. Output results sorted by top credit consumers
    console.log("==================================================");
    console.log(" ZARO CREDIT DRAIN AUDIT REPORT ");
    console.log("==================================================");

    const sortedTasks = Object.entries(summary).sort((a, b) =&gt; b[1].totalCredits - a[1].totalCredits);

    sortedTasks.forEach(([task, stats]) =&gt; {
      console.log(`Task / Endpoint : ${task}`);
      console.log(`Invocations     : ${stats.invocations}`);
      console.log(`Credits Consumed: ${stats.totalCredits}`);
      console.log(`Last Invocation : ${stats.lastRun}`);
      console.log("--------------------------------------------------");
    });

    // Flag top drainer
    const [topTask, topStats] = sortedTasks[0];
    console.log(`\n⚠️ TOP CONSUMER IDENTIFIED: [${topTask}] using ${topStats.totalCredits} credits across ${topStats.invocations} calls.`);

  } catch (err) {
    console.error(`❌ Audit failed: ${err.message}`);
  }
}

auditZaroUsage();