require("dotenv").config({ path: "../.env" });

async function run() {
    const modelName = "imagen-3.0-generate-001";
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt: "A cute banana" }],
                parameters: { sampleCount: 1 }
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data).substring(0, 300));
    } catch (e) {
        console.error(e);
    }
}
run();
