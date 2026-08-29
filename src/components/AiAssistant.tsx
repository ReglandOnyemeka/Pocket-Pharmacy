import React, { useState, useMemo } from "react";
import {
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  Pill,
  Loader2,
  Database,
  ShoppingBag,
  Boxes,
  ShieldCheck,
  FileText,
  Sparkles,
  Globe2,
  Gauge
} from "lucide-react";
import { Product } from "../types";

interface AiAssistantProps {
  initialProduct: Product | null;
  products?: Product[];
  pharmacyName?: string;
  onClearInitialProduct: () => void;
  onSelectProductForPOS?: (product: Product) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  initialProduct,
  products = [],
  pharmacyName = "Our Pharmacy",
  onClearInitialProduct,
  onSelectProductForPOS
}) => {
  const [brandName, setBrandName] = useState(initialProduct?.name || "");
  const [molecule, setMolecule] = useState(initialProduct?.api_molecule || "");
  const [category, setCategory] = useState(initialProduct?.category || "General");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string>("Pharventory AI");
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compute live instant in-house database alternatives
  const databaseMatches = useMemo(() => {
    const cleanBrand = brandName.trim().toLowerCase();
    const cleanMolecule = molecule.trim().toLowerCase();
    const cleanCategory = category.trim().toLowerCase();

    if (!cleanBrand && !cleanMolecule) return [];

    return products.filter((p) => {
      // Exclude exact same item if queried by full name
      const pMol = (p.api_molecule || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();

      const isExactMoleculeMatch = cleanMolecule && (pMol.includes(cleanMolecule) || cleanMolecule.includes(pMol));
      const isNameMatch = cleanBrand && pName.includes(cleanBrand);
      const isCategoryMatch = cleanCategory && cleanCategory !== "general" && pCat === cleanCategory;

      return isExactMoleculeMatch || isNameMatch || isCategoryMatch;
    }).sort((a, b) => {
      // Prioritize exact molecule match, then in-stock items
      const aMol = (a.api_molecule || "").toLowerCase();
      const bMol = (b.api_molecule || "").toLowerCase();
      const cleanMol = cleanMolecule;

      const aExact = cleanMol && (aMol.includes(cleanMol) || cleanMol.includes(aMol)) ? 1 : 0;
      const bExact = cleanMol && (bMol.includes(cleanMol) || cleanMol.includes(bMol)) ? 1 : 0;

      if (aExact !== bExact) return bExact - aExact;
      return b.quantity - a.quantity;
    });
  }, [brandName, molecule, category, products]);

  const handleConsult = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brandName.trim() && !molecule.trim()) {
      setError("Please provide at least a commercial brand name or an active molecule.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);
    const startTime = performance.now();

    try {
      // Prepare sanitized database products payload for Pharventory AI
      const databasePayload = products.map((p) => ({
        id: p.id,
        name: p.name,
        api_molecule: p.api_molecule,
        category: p.category,
        drug_type: p.drug_type,
        price: p.price,
        quantity: p.quantity,
        batchNumber: p.batchNumber
      }));

      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          molecule: molecule.trim(),
          category: category.trim(),
          pharmacyName,
          databaseProducts: databasePayload
        })
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTimeMs(elapsed);

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI clinical consult.");
      }

      setAiResponse(data.result);
      if (data.provider) {
        setAiProvider(data.provider);
      }
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
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header with Pharventory Intelligence Branding */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
            <Zap className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Pharventory Intelligence Engine
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Cross-references <strong>internal inventory records</strong> with <strong>external Nigerian market benchmarks & clinical pharmacology</strong> at ultra-low latency.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{products.length} Products in In-House Database</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Globe2 className="w-3 h-3 text-slate-400" />
            <span>Nigerian Market & Bio-Equivalency Mode</span>
          </div>
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
                placeholder="e.g. Augmentin 625mg, Rocephin, Lonart, Ventolin"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Active Ingredient / Molecule
              </label>
              <input
                type="text"
                placeholder="e.g. Co-amoxiclav, Ceftriaxone, Artemether, Salbutamol"
                value={molecule}
                onChange={(e) => setMolecule(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Quick Consults:</span>
              <button
                type="button"
                onClick={() => setQuickQuery("Augmentin 625mg", "Co-amoxiclav", "Antibiotics")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Augmentin
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Ventolin Inhaler", "Salbutamol", "Inhalers & Respiratory")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Ventolin
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Glucophage 500mg", "Metformin", "Antidiabetics")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Glucophage
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Lonart DS", "Artemether + Lumefantrine", "Antimalarials")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Lonart DS
              </button>
              <button
                type="button"
                onClick={() => setQuickQuery("Rocephin 1g", "Ceftriaxone", "Injections & IV Fluids")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Rocephin
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#0a4738] hover:bg-[#145a49] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#3be8b0]" />
                  <span>Consulting AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#3be8b0]" />
                  <span>Consult AI</span>
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
      </div>

      {/* ================= INTERNAL IN-HOUSE INVENTORY MATCHES ================= */}
      {(brandName.trim() || molecule.trim()) && (
        <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  In-House Inventory Alternatives (Internal Store Data)
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    {databaseMatches.length} in {pharmacyName}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Direct stock matching active ingredient (<em>{molecule || brandName}</em>) or category in your store.
                </p>
              </div>
            </div>
          </div>

          {databaseMatches.length === 0 ? (
            <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
              <Boxes className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">No direct bio-equivalent found in {pharmacyName}'s store database.</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pharventory AI provides external Nigerian market equivalents below for registered brand procurement options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {databaseMatches.map((product) => {
                const isExactMolecule = molecule && product.api_molecule.toLowerCase().includes(molecule.toLowerCase());
                const isOutOfStock = product.quantity <= 0;
                const isLowStock = product.quantity > 0 && product.quantity <= product.low_stock_threshold;

                return (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
                          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1 mt-0.5">
                            <Pill className="w-3 h-3" />
                            {product.api_molecule}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {isExactMolecule && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            In-Store Bio-Equivalent
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {product.drug_type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="text-xs font-semibold">
                        {isOutOfStock ? (
                          <span className="text-red-600">Out of Stock (0)</span>
                        ) : isLowStock ? (
                          <span className="text-amber-600">Low Stock ({product.quantity} left)</span>
                        ) : (
                          <span className="text-emerald-700">In Stock: {product.quantity} units</span>
                        )}
                      </div>

                      {onSelectProductForPOS && !isOutOfStock && (
                        <button
                          type="button"
                          onClick={() => onSelectProductForPOS(product)}
                          className="px-2.5 py-1 rounded-lg bg-[#0a4738] hover:bg-[#145a49] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Dispense in POS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= PHARVENTORY AI CLINICAL & MARKET BENCHMARK RESPONSE ================= */}
      {aiResponse && (
        <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block">
                  Pharventory Clinical & Market Intelligence Analysis
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Cross-referenced internal database + external Nigerian benchmarks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {executionTimeMs !== null && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  <Gauge className="w-3 h-3" />
                  {executionTimeMs}ms
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-amber-300 border border-slate-700 font-semibold flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {aiProvider}
              </span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line font-sans">
            {aiResponse}
          </div>
        </div>
      )}
    </div>
  );
};

