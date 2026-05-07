const fetch = require('node-fetch');

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  throw new Error("OPENROUTER_API_KEY is required.");
}
const MODELS = [
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "minimax/minimax-m2.5:free",
  "openai/gpt-oss-120b:free"
];

async function testModel(model) {
  const payload = {
    model,
    messages: [{ role: "user", content: "Use the get_test_date tool." }],
    tools: [
      {
        type: "function",
        function: {
          name: "get_test_date",
          description: "Gets the current date",
          parameters: {
               "type": "object",
               "properties": {
                    "format": { "type": "string" }
               }
          }
        }
      }
    ]
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok) {
      console.log(`✅ [${model}] SUCCESS`);
    } else {
      console.log(`❌ [${model}] FAILED: ${json.error?.message || JSON.stringify(json)}`);
    }
  } catch (e) {
    console.log(`❌ [${model}] ERROR: ${e.message}`);
  }
}

async function run() {
  for (const m of MODELS) await testModel(m);
}
run();
