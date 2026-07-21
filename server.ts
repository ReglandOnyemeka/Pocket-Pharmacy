import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to prevent boot crash if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Consult Endpoint
app.post("/api/ai-assist", async (req, res) => {
  try {
    const { brandName, molecule, category } = req.body;

    if (!brandName && !molecule) {
      return res.status(400).json({
        error: "Please provide either the Brand Name or the API Molecule for consult.",
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a highly experienced Lagos Clinical Pharmacist working in a busy community pharmacy in Lagos, Nigeria. 
Your tone should be professional, highly knowledgeable, and locally relevant. 
For any drug or product queried, you must:
1. Suggest exactly 3 clinically valid bio-equivalent alternatives (brand names available in Nigeria) with their standard strengths.
2. Provide a realistic "Lagos Market Price Benchmark" in Nigerian Naira (₦) based on major local chains (e.g., HealthPlus, Medplus, or general Lagos pharmacy prices).
3. Be brief, clinical, and precise.

CRITICAL: You must end your entire response with the exact phrase:
"Internal Support Only. Verify molecules before dispensing."`;

    const prompt = `Consult request details:
- Brand Name: ${brandName || "Unknown"}
- Active Ingredient / Molecule: ${molecule || "Unknown"}
- Category: ${category || "General"}

Provide the bio-equivalents and Lagos market price benchmarks as requested.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "No response received from GPharm AI.";
    return res.json({ result: resultText });

  } catch (error: any) {
    console.error("Error in GPharm AI Consult API:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while communicating with Gemini API.",
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Setup Vite Dev server middleware or static serve
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GPharm AI] Express server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Error starting server:", err);
});
