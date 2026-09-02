import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory tenant backup store (persists tenant snapshots on server)
const tenantBackups: Record<string, { lastBackupTime: string; payload: any }> = {};

// Gemini client lazily initialized
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Groq client initialized as secondary fallback
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: apiKey,
    });
  }
  return groqClient;
}

// Pharventory AI Consult Endpoint with In-House Database Alternatives & Nigerian Market Benchmarks
app.post("/api/ai-assist", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { brandName, molecule, category, pharmacyName, databaseProducts } = req.body;

    if (!brandName && !molecule) {
      return res.status(400).json({
        error: "Please provide either the Brand Name or the API Molecule for consult.",
      });
    }

    // Filter to relevant database products to keep prompt lightweight and ultra-fast
    const queryTerm = (brandName || molecule || "").toLowerCase().trim();
    let relevantProducts = Array.isArray(databaseProducts) ? databaseProducts : [];
    
    if (relevantProducts.length > 25) {
      const matched = relevantProducts.filter((p: any) => {
        const pName = (p.name || "").toLowerCase();
        const pMol = (p.api_molecule || "").toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        const qCat = (category || "").toLowerCase();
        return (
          (queryTerm && (pName.includes(queryTerm) || pMol.includes(queryTerm))) ||
          (qCat && pCat.includes(qCat))
        );
      });

      const others = relevantProducts.filter((p: any) => !matched.includes(p));
      relevantProducts = [...matched, ...others].slice(0, 25);
    }

    const formattedInventory = relevantProducts.length > 0
      ? relevantProducts.map((p: any) => 
          `- ${p.name} | Molecule: ${p.api_molecule || "N/A"} | Form: ${p.drug_type || "Tablet"} | Category: ${p.category} | In-Stock: ${p.quantity} units | Price: ₦${Number(p.price || 0).toLocaleString()}`
        ).join("\n")
      : "No products currently loaded in this pharmacy database.";

    const systemInstruction = `You are a highly experienced Lagos Clinical Pharmacist & Market Intelligence Specialist powered by Pharventory AI.
Your role is to assist the dispensing and pharmacy operations team by cross-referencing queries against BOTH:
1. The pharmacy's INTERNAL inventory database (in-house stock count, exact drug forms, and selling prices in ₦).
2. Registered EXTERNAL Nigerian market alternatives (NAFDAC-registered bio-equivalents, real-time Lagos wholesale/retail price benchmarks in ₦, and clinical pharmacology guidance).

For any drug or active molecule queried, format your output cleanly in Markdown:

### 1. In-House Inventory Alternatives (From Store Database)
- Search the provided "In-House Pharmacy Inventory" database carefully.
- Highlight any products currently in this store that share the exact active ingredient (molecule), bio-equivalence, or therapeutic class.
- List each matching product: exact name, available stock quantity, and in-store selling price (₦).
- If no matching product is found in the store database, state clearly: "No direct bio-equivalent currently recorded in your in-house database."

### 2. Nigerian Market Bio-Equivalent Brands & Benchmarks (External Intelligence)
- Recommend 3 registered bio-equivalent brand names available in Nigerian pharmacies with their common strengths.
- Provide a realistic Lagos Market Price Benchmark range in Nigerian Naira (₦).

### 3. Clinical Dispensing & Administration Guidance
- Detail adult/pediatric dosing intervals, food/drug interactions, and critical contraindications.

CRITICAL: Always conclude your response with the exact phrase:
"Internal Support Only. Verify molecules before dispensing."`;

    const prompt = `Pharmacy Consult Request:
- Queried Commercial / Brand Name: ${brandName || "Not specified"}
- Active Ingredient / Molecule: ${molecule || "Not specified"}
- Therapeutic Category: ${category || "General"}
- Pharmacy Name: ${pharmacyName || "Our Pharmacy"}

In-House Store Inventory Database (${relevantProducts.length} items):
${formattedInventory}

Analyze this drug request using Pharventory AI. Check our store database first for matching in-house items, then benchmark against external Nigerian market equivalents and clinical guidance.`;

    // 1. Primary Engine: Ultra-fast Gemini models with fallback
    const gemini = getGeminiClient();
    if (gemini) {
      const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
      for (const modelId of candidateModels) {
        try {
          const response = await gemini.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });

          const resultText = response.text || "No response received from AI engine.";
          return res.json({
            result: resultText,
            provider: `Pharventory AI (${modelId})`,
            model: modelId,
          });
        } catch (geminiErr: any) {
          console.warn(`[Gemini model ${modelId} attempt failed]`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 2. Secondary Engine: Groq Fallback if configured
    const groq = getGroqClient();
    if (groq) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        });

        const resultText = chatCompletion.choices[0]?.message?.content || "No response received from Pharventory AI.";
        return res.json({
          result: resultText,
          provider: "Pharventory AI (Llama 3.1 Instant)",
          model: "llama-3.1-8b-instant",
        });
      } catch (groqErr: any) {
        console.warn("[Groq Fallback error]", groqErr?.message || groqErr);
      }
    }

    return res.status(500).json({
      error: "AI engine could not generate a response. Please check your network connection or try again.",
    });

  } catch (error: any) {
    console.error("Error in Pharventory AI Consult API:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while communicating with Pharventory AI.",
    });
  }
});

// Tenant Database Backup Endpoint (Manual & 10-Min Auto-Sync)
app.post("/api/backup-tenant", (req, res) => {
  try {
    const { pharmacyId, snapshot } = req.body;
    if (!pharmacyId || !snapshot) {
      return res.status(400).json({ error: "Missing pharmacyId or snapshot data." });
    }

    const timestamp = new Date().toISOString();
    tenantBackups[pharmacyId] = {
      lastBackupTime: timestamp,
      payload: snapshot,
    };

    return res.json({
      success: true,
      pharmacyId,
      backupTime: timestamp,
      message: "Tenant database backed up successfully.",
    });
  } catch (err: any) {
    console.error("Error in tenant backup:", err);
    return res.status(500).json({ error: "Failed to persist tenant backup." });
  }
});

// Fetch latest tenant backup snapshot
app.get("/api/backup-tenant/:pharmacyId", (req, res) => {
  const { pharmacyId } = req.params;
  const backup = tenantBackups[pharmacyId];
  if (!backup) {
    return res.status(404).json({ error: "No server backup found for this tenant." });
  }
  return res.json(backup);
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
    console.log(`[Pocket Pharmacy] Express server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Error starting server:", err);
});
