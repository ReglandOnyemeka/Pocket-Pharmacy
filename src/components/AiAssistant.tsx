import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pill,
  Send,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Product } from "../types";

interface AiAssistantProps {
  initialProduct: Product | null;
  onClearInitialProduct: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  initialProduct,
  onClearInitialProduct
}) => {
  const [brandName, setBrandName] = useState(initialProduct?.name || "");
  const [molecule, setMolecule] = useState(initialProduct?.api_molecule || "");
  const [category, setCategory] = useState(initialProduct?.category || "General");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConsult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brandName.trim() && !molecule.trim()) {
      setError("Please provide at least a brand name or an active ingredient.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          molecule: molecule.trim(),
          category: category.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate clinical consult.");
      }

      setAiResponse(data.result);
    } catch (err: any) {
      setError(err.message || "An error occurred while communicating with the AI model.");
    } finally {
      setLoading(false);
    }
  };

  const setQuickQuery = (brand: string, mol: string, cat: string) => {
    setBrandName(brand);
    setMolecule(mol);
    setCategory(cat);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Clinical Drug Consult & Benchmark Engine
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Query bio-equivalent generic alternatives, registered brands in Nigeria, and current Lagos market price benchmarks.
          </p>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <form onSubmit={handleConsult} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Commercial / Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Augmentin 625mg, Rocephin, Lonart"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Active Ingredient / Molecule
              </label>
              <input
                type="text"
                placeholder="e.g. Co-amoxiclav, Ceftriaxone, Artemether"
                value={molecule}
                onChange={(e) => setMolecule(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold">Quick Consults:</span>
              <button
                type="button"
                onClick={() => setQuickQuery("Augmentin 625mg", "Co-amoxiclav", "Antibiotics")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Augmentin
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Ventolin Inhaler", "Salbutamol", "Inhalers & Respiratory")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Ventolin
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Glucophage 500mg", "Metformin", "Antidiabetics")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Glucophage
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Consult...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Consult
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Response Card */}
        {aiResponse && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-inner space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white">Pharmacist AI Output</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                Clinical Reference
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line font-sans">
              {aiResponse}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
