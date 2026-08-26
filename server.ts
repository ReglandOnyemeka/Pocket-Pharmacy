import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory tenant backup store (persists tenant snapshots on server)
const tenantBackups: Record<string, { lastBackupTime: string; payload: any }> = {};

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

// AI Consult Endpoint with In-House Database Alternatives Support
app.post("/api/ai-assist", async (req, res) => {
  try {
    const { brandName, molecule, category, pharmacyName, databaseProducts } = req.body;

    if (!brandName && !molecule) {
      return res.status(400).json({
        error: "Please provide either the Brand Name or the API Molecule for consult.",
      });
    }

    const ai = getGeminiClient();

    const formattedInventory = Array.isArray(databaseProducts) && databaseProducts.length > 0
      ? databaseProducts.map((p: any) => 
          `- ${p.name} | Molecule: ${p.api_molecule} | Form: ${p.drug_type || "Tablet"} | Category: ${p.category} | In-Stock: ${p.quantity} units | Price: ₦${Number(p.price || 0).toLocaleString()}`
        ).join("\n")
      : "No products currently loaded in this pharmacy database.";

    const systemInstruction = `You are a highly experienced Lagos Clinical Pharmacist working in a Nigerian pharmacy operating workspace.
Your role is to assist the dispensing team by cross-referencing queries against both the pharmacy's internal inventory database and registered Nigerian market alternatives.

For any drug or product queried, you must provide a structured consult:

### 1. In-House Inventory Alternatives (From Your Database)
- Check the provided "In-House Pharmacy Inventory" below.
- Highlight any products in the pharmacy's database that share the same active ingredient (molecule), bio-equivalence, or therapeutic class.
- List their exact product name, stock quantity available, and in-store selling price (₦).
- If no matching product is found in the current store database, explicitly state: "No direct bio-equivalent currently recorded in your in-house database."

### 2. Nigerian Market Bio-Equivalent Brands & Benchmarks
- Suggest 3 registered bio-equivalent brand names available in Nigerian pharmacies with their standard strengths.
- Provide a realistic Lagos Market Price Benchmark range in Nigerian Naira (₦).

### 3. Clinical Dispensing & Administration Notes
- Provide concise guidance on dosage frequency, food interactions, and key contraindications.

CRITICAL: End your response with the exact phrase:
"Internal Support Only. Verify molecules before dispensing."`;

    const prompt = `Consult request details:
- Commercial / Brand Name: ${brandName || "Unknown"}
- Active Ingredient / Molecule: ${molecule || "Unknown"}
- Category: ${category || "General"}
- Pharmacy Name: ${pharmacyName || "Our Pharmacy"}

In-House Pharmacy Inventory Database (${Array.isArray(databaseProducts) ? databaseProducts.length : 0} items):
${formattedInventory}

Analyze this drug request, prioritize any matching alternatives already present in our database, and provide external Nigerian market equivalents and clinical guidance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const resultText = response.text || "No response received from Pharmacy AI.";
    return res.json({ result: resultText });

  } catch (error: any) {
    console.error("Error in Pharmacy AI Consult API:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while communicating with Gemini API.",
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
