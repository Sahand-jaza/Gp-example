import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testGemini() {
  try {
    console.log("Testing Gemini API Key...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Tell me a short joke about programming.",
    });

    console.log("Response:", response.text);
    console.log("✅ Success!");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    if (err.status) console.error("Status:", err.status);
  }
}

testGemini();
