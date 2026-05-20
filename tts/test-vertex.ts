import { GoogleGenAI, Modality } from '@google/genai';
import { GoogleAuth } from 'google-auth-library';

async function main() {
  console.log("Starting Vertex AI Live WebSocket connection test...");
  
  try {
    // 1. Generate local ADC token or Vertex AI Auth Token
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;
    
    if (!accessToken) {
      throw new Error("Could not retrieve local Google authentication access token. Run 'gcloud auth application-default login' first.");
    }
    
    console.log("Local Google credentials authenticated successfully.");

    // 2. Initialize GoogleGenAI client with Vertex AI configuration
    const ai = new GoogleGenAI({
      vertexai: true,
      apiKey: accessToken,
      httpOptions: {
        baseUrl: 'https://us-west1-aiplatform.googleapis.com'
      }
    });

    // 3. Connect to the Live API WebSocket
    console.log("Connecting to Vertex AI Live WebSocket endpoint...");
    const session = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => {
          console.log("WebSocket connected successfully to Vertex AI!");
          console.log("Sending a test text greeting: 'Hello Vertex Live!'...");
          session.sendClientContent({
            turns: [{
              parts: [{ text: "Hello Vertex Live! Respond briefly with 'Vertex is connected successfully!' in text format." }]
            }],
            endOfTurn: true
          });
        },
        onmessage: (message) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
            console.log("\n[AI Response Text]:", message.serverContent.modelTurn.parts[0].text);
          }
          if (message.serverContent?.turnComplete) {
            console.log("\nTurn completed. Closing session...");
            session.close();
          }
        },
        onerror: (e) => {
          console.error("WebSocket Error:", e);
        },
        onclose: (e) => {
          console.log("WebSocket connection closed:", e.reason || "No reason given");
          process.exit(0);
        }
      }
    });
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
}

main();
