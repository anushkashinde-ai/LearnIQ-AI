import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const models = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite-001",
];

async function testModels() {
  for (const model of models) {
    try {
      console.log(`\nTesting: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: "Say Hello",
      });

      console.log("✅ SUCCESS:", response.text);
    } catch (err) {
      console.log("❌ FAILED:", err.message);
    }
  }
}

testModels();