import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testEmbedding() {
  try {
    const response = await ai.models.embedContent({
      model: "models/gemini-embedding-001",
      contents: "TCP is a reliable transport protocol.",
    });

    console.log("✅ Embedding Generated Successfully!");

    console.log("Response:");
    console.log(response);

    // If embeddings are returned as an array
    if (response.embeddings) {
      console.log("Vector Length:", response.embeddings[0].values.length);
      console.log(
        "First 10 values:",
        response.embeddings[0].values.slice(0, 10)
      );
    }

    // If a single embedding object is returned
    if (response.embedding) {
      console.log("Vector Length:", response.embedding.values.length);
      console.log(
        "First 10 values:",
        response.embedding.values.slice(0, 10)
      );
    }
  } catch (err) {
    console.error(err);
  }
}

testEmbedding();