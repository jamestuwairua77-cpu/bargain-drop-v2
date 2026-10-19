const fs = require('fs');

// We simulate the onRequest handler of chat.js
async function runRubyTest() {
  const env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
  const mockBase = "https://bargain-drop.online";

  const queries = [
    "Hello Ruby, what's your name and what do you do?",
    "Do you have any discount codes or coupons?",
    "How much is shipping and how long does delivery take?",
    "What is your return and refund policy?",
    "What categories and subcategories do you have?",
    "Can you recommend a pet bed or dog accessories?",
    "What payment methods do you accept?",
    "Where can I track my order?",
    "How does clothing sizing work?",
    "Can I buy furniture or home decor here?"
  ];

  // Load chat module functions by reading the code
  const code = fs.readFileSync("/bargain-drop-repo/functions/api/chat.js", "utf8");
  
  // Create a CommonJS wrapper for testing
  const cjsCode = code
    .replace("import { corsHeaders, listOrders } from '../_sync-lib.js';", "const listOrders = async () => []; const corsHeaders = () => ({});")
    .replace("export async function onRequest", "async function onRequest")
    + "\nmodule.exports = { onRequest, intelligentResponse, resolveTools, STORE_KNOWLEDGE, CJ_CATEGORIES };";

  fs.writeFileSync("/tmp/ruby-eval.cjs", cjsCode);
  const { intelligentResponse, resolveTools, CJ_CATEGORIES } = require("/tmp/ruby-eval.cjs");

  console.log("=== TESTING RUBY ON 10 CRITICAL STORE QUESTIONS ===\n");
  for (const q of queries) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Q: "${q}"`);
    const facts = await resolveTools(env, q, mockBase + "/api/chat", {});
    const res = intelligentResponse(q, facts, mockBase);
    console.log(`A: ${res.reply}\n`);
    console.log(`Suggestions: [${(res.suggestions || []).join(' | ')}]`);
  }
}

runRubyTest().catch(console.error);
