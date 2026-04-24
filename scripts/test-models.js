import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Say hello!");
    console.log("Success for gemini-flash-latest!");
    console.log("Response:", result.response.text());
  } catch(e) {
    console.error("Test failed for gemini-flash-latest:");
    console.error(e.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
    const result2 = await model2.generateContent("Say hello!");
    console.log("Success for gemini-pro-latest!");
    console.log("Response:", result2.response.text());
  } catch(e) {
    console.error("Test failed for gemini-pro-latest:");
    console.error(e.message);
  }
}
run();



