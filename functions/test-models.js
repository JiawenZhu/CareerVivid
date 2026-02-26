require("dotenv").config({ path: "../.env" });
console.log("Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
    try {
        const modelName = "imagen-3.0-generate-001";
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Testing ${modelName}...`);
        const result = await model.generateContent("A cute banana");
        console.log(`Success! Response properties: ${Object.keys(result.response)}`);
    } catch (e) {
        console.error(`Test failed: ${e.message}`);
    }
}
run();
