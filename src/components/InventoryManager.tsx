import React, { useState, useMemo, useRef } from "react";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Tag
} from "lucide-react";
import * as XLSX from "xlsx";
import { Product } from "../types";
import { DRUG_CATEGORIES, DRUG_TYPES } from "../data/initialData";

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkImport: (products: Omit<Product, "id">[]) => void;
  pharmacyId: string;
  canEditInventory: boolean;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkImport,
  pharmacyId,
  canEditInventory
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [newName, setNewName] = useState("");
  const [newMolecule, setNewMolecule] = useState("");
  const [newCategory, setNewCategory] = useState("Antibiotics");
  const [newPrice, setNewPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newLowThreshold, setNewLowThreshold] = useState("10");
  const [newExpiryMonth, setNewExpiryMonth] = useState("12");
  const [newExpiryYear, setNewExpiryYear] = useState("2027");
  const [newDrugType, setNewDrugType] = useState<Product["drug_type"]>("Tablet");
  const [newPom, setNewPom] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "All Categories" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.api_molecule.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.drug_type.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Inventory valuation summary
  const summary = useMemo(() => {
    const totalCost = products.reduce((acc, p) => acc + (p.cost_price || p.price * 0.7) * p.quantity, 0);
    const totalSales = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
    const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
    const lowStockCount = products.filter((p) => p.quantity <= p.low_stock_threshold).length;
    return { totalCost, totalSales, totalUnits, lowStockCount };
  }, [products]);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice || !newQuantity) {
      setFormError("Please fill in the product name, price, and initial quantity.");
      return;
    }

    const price = parseFloat(newPrice);
    const cost_price = newCostPrice ? parseFloat(newCostPrice) : Math.round(price * 0.7);
    const quantity = parseInt(newQuantity, 10);
    const low_stock_threshold = parseInt(newLowThreshold, 10) || 10;
    const expiry_month = parseInt(newExpiryMonth, 10) || 12;
    const expiry_year = parseInt(newExpiryYear, 10) || 2027;

    onAddProduct({
      name: newName.trim(),
      api_molecule: newMolecule.trim() || newName.trim(),
      category: newCategory,
      price,
      cost_price,
      quantity,
      low_stock_threshold,
      expiry_month,
      expiry_year,
      drug_type: newDrugType,
      pom: newPom,
      pharmacyId
    });

    // Reset Form
    setNewName("");
    setNewMolecule("");
    setNewPrice("");
    setNewCostPrice("");
    setNewQuantity("");
    setFormError(null);
    setIsAddModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = products.map((p) => ({
      "Product Name": p.name,
      "API Active Ingredient": p.api_molecule,
      Category: p.category,
      "Drug Type": p.drug_type,
      "Selling Price (NGN)": p.price,
      "Cost Price (NGN)": p.cost_price || Math.round(p.price * 0.7),
      "Current Stock Quantity": p.quantity,
      "Low Stock Threshold": p.low_stock_threshold,
      "Expiry Month": p.expiry_month,
      "Expiry Year": p.expiry_year,
      "Prescription Only (POM)": p.pom ? "Yes" : "No"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pharmacy Inventory");
    XLSX.writeFile(workbook, `Pocket_Pharmacy_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Import from Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const parsedProducts: Omit<Product, "id">[] = [];
        data.forEach((row) => {
          const name = row["Product Name"] || row["Name"] || row["name"];
          if (name) {
            const price = parseFloat(row["Selling Price (NGN)"] || row["Price"] || row["price"]) || 1000;
            const cost_price = parseFloat(row["Cost Price (NGN)"] || row["Cost"] || row["cost_price"]) || Math.round(price * 0.7);
            const quantity = parseInt(row["Current Stock Quantity"] || row["Quantity"] || row["quantity"], 10) || 0;
            parsedProducts.push({
              name: String(name).trim(),
              api_molecule: String(row["API Active Ingredient"] || row["Molecule"] || name).trim(),
              category: String(row["Category"] || "Other").trim(),
              drug_type: (row["Drug Type"] as any) || "Tablet",
              price,
              cost_price,
              quantity,
              low_stock_threshold: parseInt(row["Low Stock Threshold"], 10) || 10,
              expiry_month: parseInt(row["Expiry Month"], 10) || 12,
              expiry_year: parseInt(row["Expiry Year"], 10) || 2027,
              pom: String(row["Prescription Only (POM)"]).toLowerCase() === "yes",
              pharmacyId
            });
          }
        });

        if (parsedProducts.length > 0) {
          onBulkImport(parsedProducts);
        }
      } catch (err) {
        console.error("Excel import error", err);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory Value</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">₦{summary.totalSales.toLocaleString("en-NG")}</p>
          <p className="text-xs text-slate-400 mt-1">Based on retail selling prices</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchase Cost</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">₦{summary.totalCost.toLocaleString("en-NG")}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            Potential Margin: ₦{(summary.totalSales - summary.totalCost).toLocaleString("en-NG")}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock SKU Count</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{products.length} Products</p>
          <p className="text-xs text-slate-400 mt-1">{summary.totalUnits.toLocaleString()} units in pharmacy</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Watch</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${summary.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {summary.lowStockCount} Items
          </p>
          <p className="text-xs text-slate-400 mt-1">At or below reorder threshold</p>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Pharmacy Inventory Catalog
            </h2>
            <p className="text-sm text-slate-500">
              Manage product pricing, stock volumes, batch expiry, and reorder levels
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export Excel
            </button>

            {canEditInventory && (
              <>
                <label
                  title="Upload an Excel (.xlsx, .xls) or CSV file for bulk product entry"
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-cyan-600" />
                  Bulk Product entry
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, active molecule ingredient, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DRUG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Product & Molecule</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-center">Expiry</th>
                {canEditInventory && <th className="py-3.5 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No inventory products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{p.api_molecule}</p>
                          </div>
                          {p.pom && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              POM
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600">
                        ₦{(p.cost_price || Math.round(p.price * 0.7)).toLocaleString("en-NG")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₦{p.price.toLocaleString("en-NG")}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            p.quantity === 0
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : isLow
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {p.quantity} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600">
                        {String(p.expiry_month).padStart(2, "0")}/{p.expiry_year}
                      </td>

                      {canEditInventory && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add Product to Pharmacy Inventory
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Brand / Commercial Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxil 500mg"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Active Molecule / API
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin"
                    value={newMolecule}
                    onChange={(e) => setNewMolecule(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Therapeutic Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DRUG_CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Dosage Form / Drug Type
                  </label>
                  <select
                    value={newDrugType}
                    onChange={(e) => setNewDrugType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DRUG_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Selling Price (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="4500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3150"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Initial Units *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="24"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newLowThreshold}
                    onChange={(e) => setNewLowThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Expiry Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newExpiryMonth}
                    onChange={(e) => setNewExpiryMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Expiry Year
                  </label>
                  <input
                    type="number"
                    min="2025"
                    max="2040"
                    value={newExpiryYear}
                    onChange={(e) => setNewExpiryYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newPom"
                  checked={newPom}
                  onChange={(e) => setNewPom(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="newPom" className="text-sm font-semibold text-slate-700">
                  Prescription Only Medicine (POM clearance required)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                >
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                Edit Product: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Selling Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Cost Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.cost_price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Current Stock Units
                  </label>
                  <input
                    type="number"
                    value={editingProduct.quantity}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={editingProduct.low_stock_threshold}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        low_stock_threshold: parseInt(e.target.value, 10) || 10
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
