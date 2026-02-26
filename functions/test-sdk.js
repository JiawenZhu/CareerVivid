const { GoogleGenAI } = require("@google/genai");

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: "fake-key" });
        if (ai.models && ai.models.generateImages) {
            console.log("Method ai.models.generateImages exists!");
        } else {
            console.log("No generateImages method found.");
        }
    } catch (e) {
        console.error(e);
    }
}
run();
