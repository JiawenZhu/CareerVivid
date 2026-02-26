const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
        contents: [{role: "user", parts: [{text: "A cute banana"}]}],
        generationConfig: { responseModalities: ["IMAGE"] }
    });
    console.log(result.response);
  } catch(e) {
    console.error("Test failed for gemini-2.5-flash:");
    console.error(e.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result2 = await model2.generateContent({
        contents: [{role: "user", parts: [{text: "A cute banana"}]}],
        generationConfig: { responseModalities: ["IMAGE"] }
    });
    console.log("Success for gemini-2.0-flash-exp!");
  } catch(e) {
    console.error("Test failed for gemini-2.0-flash-exp:");
    console.error(e.message);
  }
}
run();
