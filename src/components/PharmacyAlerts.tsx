import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar
} from "lucide-react";
import { Product } from "../types";

interface PharmacyAlertsProps {
  products: Product[];
  onRequestAiConsult: (product: Product) => void;
}

export const PharmacyAlerts: React.FC<PharmacyAlertsProps> = ({
  products,
  onRequestAiConsult
}) => {
  const [activeTab, setActiveTab] = useState<"lowStock" | "expiring">("lowStock");

  const currentYear = 2026;
  const currentMonth = 8; // August 2026

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity <= p.low_stock_threshold);
  }, [products]);

  // Expiring products (within next 6 months)
  const expiringProducts = useMemo(() => {
    return products
      .map((p) => {
        const diffMonths = (p.expiry_year - currentYear) * 12 + (p.expiry_month - currentMonth);
        return { product: p, diffMonths };
      })
      .filter(({ diffMonths }) => diffMonths <= 6)
      .sort((a, b) => a.diffMonths - b.diffMonths);
  }, [products]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Stock Vigilance & Expiry Monitor
          </h2>
          <p className="text-sm text-slate-500">
            Track understocked medicines and near-expiry batches to protect pharmacy inventory
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("lowStock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "lowStock"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Low Stock ({lowStockProducts.length})
          </button>

          <button
            onClick={() => setActiveTab("expiring")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "expiring"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4 text-red-500" />
            Expiring Batches ({expiringProducts.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "lowStock" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{lowStockProducts.length} medicines need restocking urgently</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700 text-base">All stock levels are optimal</p>
                <p className="text-xs text-slate-400 mt-1">No products are currently below reorder thresholds.</p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{p.api_molecule}</p>
                    <p className="text-xs text-slate-600">
                      Reorder Threshold: <span className="font-semibold">{p.low_stock_threshold} units</span> • Retail: <span className="font-semibold">₦{p.price.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-200">
                        {p.quantity} units left
                      </span>
                    </div>

                    <button
                      onClick={() => onRequestAiConsult(p)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Find Equivalents
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "expiring" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-900 font-semibold">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Batches expiring within 6 months (Pharmacovigilance Rule)</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {expiringProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700 text-base">No near-expiry inventory</p>
                <p className="text-xs text-slate-400 mt-1">All batches have valid long shelf-lives.</p>
              </div>
            ) : (
              expiringProducts.map(({ product: p, diffMonths }) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{p.api_molecule}</p>
                    <p className="text-xs text-slate-600">
                      Remaining stock: <span className="font-semibold">{p.quantity} units</span> • Retail value: <span className="font-semibold">₦{(p.quantity * p.price).toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono ${
                          diffMonths <= 1
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {diffMonths <= 0
                          ? "Expiring this month"
                          : `Expires in ${diffMonths} month${diffMonths === 1 ? "" : "s"}`} ({String(p.expiry_month).padStart(2, "0")}/{p.expiry_year})
                      </span>
                    </div>

                    <button
                      onClick={() => onRequestAiConsult(p)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Consult
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
