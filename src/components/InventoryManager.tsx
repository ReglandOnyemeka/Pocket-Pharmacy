import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Tag,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Info,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { Product } from "../types";
import { DRUG_CATEGORIES, DRUG_TYPES } from "../data/initialData";
import { useToast } from "../context/ToastContext";

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
  const { notifySuccess, notifyError, notifyUpload } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedBulkProducts, setParsedBulkProducts] = useState<Omit<Product, "id">[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isDraggingBulk, setIsDraggingBulk] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const INVENTORY_VIEW_LIMIT = 10;

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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / INVENTORY_VIEW_LIMIT));
  const currentSafePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentSafePage - 1) * INVENTORY_VIEW_LIMIT;
    return filteredProducts.slice(start, start + INVENTORY_VIEW_LIMIT);
  }, [filteredProducts, currentSafePage]);

  // Swipe handlers for mobile touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    // Threshold of 50px for vertical swipe
    if (diffY > 50) {
      // Swiped UP -> Next 10 products
      if (currentSafePage < totalPages) {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (diffY < -50) {
      // Swiped DOWN -> Previous 10 products
      if (currentSafePage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    touchStartY.current = null;
  };

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

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        "Product Name": "Amoxil 500mg",
        "API Active Ingredient": "Amoxicillin Trihydrate",
        Category: "Antibiotics",
        "Drug Type": "Capsule",
        "Selling Price (NGN)": 2500,
        "Cost Price (NGN)": 1800,
        "Current Stock Quantity": 120,
        "Low Stock Threshold": 20,
        "Expiry Month": 11,
        "Expiry Year": 2027,
        "Prescription Only (POM)": "Yes"
      },
      {
        "Product Name": "Emzor Paracetamol 500mg",
        "API Active Ingredient": "Paracetamol",
        Category: "Analgesics & Pain",
        "Drug Type": "Tablet",
        "Selling Price (NGN)": 800,
        "Cost Price (NGN)": 500,
        "Current Stock Quantity": 250,
        "Low Stock Threshold": 30,
        "Expiry Month": 8,
        "Expiry Year": 2028,
        "Prescription Only (POM)": "No"
      },
      {
        "Product Name": "Coartem 80/480mg",
        "API Active Ingredient": "Artemether / Lumefantrine",
        Category: "Antimalarial",
        "Drug Type": "Tablet",
        "Selling Price (NGN)": 3200,
        "Cost Price (NGN)": 2400,
        "Current Stock Quantity": 75,
        "Low Stock Threshold": 15,
        "Expiry Month": 10,
        "Expiry Year": 2027,
        "Prescription Only (POM)": "No"
      },
      {
        "Product Name": "Ventolin Inhaler 100mcg",
        "API Active Ingredient": "Salbutamol Sulfate",
        Category: "Respiratory",
        "Drug Type": "Inhaler",
        "Selling Price (NGN)": 4500,
        "Cost Price (NGN)": 3500,
        "Current Stock Quantity": 40,
        "Low Stock Threshold": 10,
        "Expiry Month": 5,
        "Expiry Year": 2027,
        "Prescription Only (POM)": "Yes"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Upload Template");
    XLSX.writeFile(workbook, "Pocket_Pharmacy_Bulk_Template.xlsx");
    notifySuccess("Template Downloaded", "Pocket_Pharmacy_Bulk_Template.xlsx is ready for editing.");
  };

  // Process and parse uploaded Excel/CSV file
  const handleProcessFile = (file: File) => {
    setBulkError(null);
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        if (!wsname) {
          setBulkError("The uploaded spreadsheet has no sheets.");
          setParsedBulkProducts([]);
          return;
        }
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          setBulkError("The selected spreadsheet contains no data rows to import.");
          setParsedBulkProducts([]);
          return;
        }

        const parsedProducts: Omit<Product, "id">[] = [];
        data.forEach((row) => {
          const name =
            row["Product Name"] ||
            row["Name"] ||
            row["name"] ||
            row["Product"] ||
            row["Medication"];
          if (name && String(name).trim().length > 0) {
            const price =
              parseFloat(
                row["Selling Price (NGN)"] ||
                  row["Selling Price"] ||
                  row["Price"] ||
                  row["price"]
              ) || 1000;
            const cost_price =
              parseFloat(
                row["Cost Price (NGN)"] ||
                  row["Cost Price"] ||
                  row["Cost"] ||
                  row["cost_price"]
              ) || Math.round(price * 0.7);
            const quantity =
              parseInt(
                row["Current Stock Quantity"] ||
                  row["Quantity"] ||
                  row["quantity"] ||
                  row["Stock"],
                10
              ) || 0;
            const low_threshold =
              parseInt(
                row["Low Stock Threshold"] ||
                  row["Low Stock"] ||
                  row["low_stock_threshold"],
                10
              ) || 10;
            const exp_month =
              parseInt(row["Expiry Month"] || row["Exp Month"], 10) || 12;
            const exp_year =
              parseInt(row["Expiry Year"] || row["Exp Year"], 10) || 2027;
            const pom_val = String(
              row["Prescription Only (POM)"] ||
                row["POM"] ||
                row["Prescription Only"] ||
                ""
            ).toLowerCase();

            parsedProducts.push({
              name: String(name).trim(),
              api_molecule: String(
                row["API Active Ingredient"] ||
                  row["Molecule"] ||
                  row["Active Ingredient"] ||
                  name
              ).trim(),
              category: String(row["Category"] || "Other").trim(),
              drug_type: (row["Drug Type"] || row["Type"] || "Tablet") as any,
              price,
              cost_price,
              quantity,
              low_stock_threshold: low_threshold,
              expiry_month: exp_month,
              expiry_year: exp_year,
              pom: pom_val === "yes" || pom_val === "true" || pom_val === "1",
              pharmacyId
            });
          }
        });

        if (parsedProducts.length === 0) {
          setBulkError(
            "Could not recognize any valid products. Please ensure the Excel file has a 'Product Name' column."
          );
          setParsedBulkProducts([]);
        } else {
          setParsedBulkProducts(parsedProducts);
        }
      } catch (err) {
        console.error("Excel parse error", err);
        setBulkError(
          "Failed to parse file. Please verify it is a valid .xlsx, .xls, or .csv spreadsheet."
        );
        setParsedBulkProducts([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmBulkUpload = () => {
    if (parsedBulkProducts.length === 0) return;
    onBulkImport(parsedBulkProducts);
    handleCloseBulkModal();
  };

  const handleCloseBulkModal = () => {
    setIsBulkModalOpen(false);
    setBulkFile(null);
    setParsedBulkProducts([]);
    setBulkError(null);
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
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
    notifySuccess("Inventory Exported", `Generated spreadsheet with ${products.length} products.`);
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
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
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
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#0a4738]" />
                  Bulk Upload
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
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

        {/* 10-Product View Bar & Swipe Instructions */}
        <div className="p-3 px-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Showing {filteredProducts.length === 0 ? 0 : (currentSafePage - 1) * INVENTORY_VIEW_LIMIT + 1}–
              {Math.min(currentSafePage * INVENTORY_VIEW_LIMIT, filteredProducts.length)} of {filteredProducts.length} Inventory Products (10 per view)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
              <ArrowUpDown className="w-3 h-3" /> Swipe / Scroll
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentSafePage > 1) {
                  setCurrentPage((p) => p - 1);
                  tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentSafePage <= 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              title="Previous 10 products"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 px-1 font-mono">
              {currentSafePage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentSafePage < totalPages) {
                  setCurrentPage((p) => p + 1);
                  tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentSafePage >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              title="Next 10 products"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Product Card List (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-3 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No inventory products found</p>
            </div>
          ) : (
            paginatedProducts.map((p) => {
              const isLow = p.quantity <= p.low_stock_threshold;
              return (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm leading-snug">{p.name}</span>
                        {p.pom && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            POM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{p.api_molecule}</p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono shrink-0 ${
                        p.quantity === 0
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : isLow
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {p.quantity} in stock
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Selling Price</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">₦{p.price.toLocaleString("en-NG")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Expiry / Category</span>
                      <span className="font-semibold text-slate-700">
                        {String(p.expiry_month).padStart(2, "0")}/{p.expiry_year} • {p.category}
                      </span>
                    </div>
                  </div>

                  {canEditInventory && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Products Table (hidden sm:block) */}
        <div
          ref={tableContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="hidden sm:block overflow-x-auto touch-pan-y overscroll-contain max-h-[600px] overflow-y-auto"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
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
                paginatedProducts.map((p) => {
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
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
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-800">{currentSafePage}</span> of{" "}
              <span className="font-bold text-slate-800">{totalPages}</span> (10 items/page)
            </p>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setCurrentPage(num);
                    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                    currentSafePage === num
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Guidance & Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 text-[#0a4738] rounded-2xl shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Bulk Inventory Upload Guide
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Structure your Excel (.xlsx, .xls) or CSV spreadsheet using the columns below for successful import
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBulkModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              
              {/* Template Download & Key Note Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold text-emerald-950 text-sm">
                      Recommended: Use Our Pre-Formatted Excel Template
                    </p>
                    <p className="mt-0.5 text-emerald-800">
                      Download the ready-to-fill spreadsheet with correct column headers, sample pharmacy stock items, and pricing structures.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0a4738] hover:bg-[#145a49] text-[#3be8b0] hover:text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Template (.xlsx)
                </button>
              </div>

              {/* Required & Optional Column Layout Guide */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Expected Excel Columns & Data Types
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  
                  {/* Required Column: Product Name */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Product Name
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Medication trade name & strength (e.g. <span className="font-semibold text-slate-700">Amoxil 500mg</span>, <span className="font-semibold text-slate-700">Coartem 80/480</span>).
                    </p>
                  </div>

                  {/* Required Column: Selling Price */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Selling Price (NGN)
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Unit sales price in Naira (e.g. <span className="font-semibold text-slate-700">2500</span>, <span className="font-semibold text-slate-700">800</span>). Numeric without symbols.
                    </p>
                  </div>

                  {/* Optional Column: API Molecule */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        API Active Ingredient
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Generic chemical molecule (e.g. <span className="font-semibold text-slate-700">Amoxicillin</span>, <span className="font-semibold text-slate-700">Paracetamol</span>).
                    </p>
                  </div>

                  {/* Optional Column: Category */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Category
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      E.g. <span className="font-semibold text-slate-700">Antibiotics, Antimalarial, Analgesics & Pain, Cardiovascular</span>.
                    </p>
                  </div>

                  {/* Optional Column: Drug Type */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Drug Type
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">Tablet, Capsule, Syrup, Suspension, Inhaler, Injection, Ointment, Drops</span>.
                    </p>
                  </div>

                  {/* Optional Column: Current Stock */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Current Stock Quantity
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Initial inventory unit count on shelf (e.g. <span className="font-semibold text-slate-700">120</span>). Defaults to 0.
                    </p>
                  </div>

                  {/* Optional Column: Cost Price */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Cost Price (NGN)
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Purchase / wholesale unit cost (defaults to 70% of selling price).
                    </p>
                  </div>

                  {/* Optional Column: Expiry & POM */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Expiry & POM (Prescription)
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">Expiry Month</span> (1-12), <span className="font-semibold text-slate-700">Expiry Year</span> (e.g. 2027), <span className="font-semibold text-slate-700">Prescription Only</span> (Yes/No).
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Sample Spreadsheet Preview Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  Visual Spreadsheet Layout Example
                </h4>
                
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="min-w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
                      <tr>
                        <th className="p-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">Product Name *</th>
                        <th className="p-2 border-r border-slate-200">API Active Ingredient</th>
                        <th className="p-2 border-r border-slate-200">Category</th>
                        <th className="p-2 border-r border-slate-200">Drug Type</th>
                        <th className="p-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">Selling Price (NGN) *</th>
                        <th className="p-2 border-r border-slate-200">Cost Price (NGN)</th>
                        <th className="p-2 border-r border-slate-200">Current Stock Quantity</th>
                        <th className="p-2 border-r border-slate-200">Expiry Month</th>
                        <th className="p-2 border-r border-slate-200">Expiry Year</th>
                        <th className="p-2">Prescription Only (POM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-600 bg-white whitespace-nowrap">
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-100">Amoxil 500mg</td>
                        <td className="p-2 border-r border-slate-100">Amoxicillin Trihydrate</td>
                        <td className="p-2 border-r border-slate-100">Antibiotics</td>
                        <td className="p-2 border-r border-slate-100">Capsule</td>
                        <td className="p-2 font-bold text-emerald-700 border-r border-slate-100">2500</td>
                        <td className="p-2 border-r border-slate-100">1800</td>
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-800">120</td>
                        <td className="p-2 border-r border-slate-100">11</td>
                        <td className="p-2 border-r border-slate-100">2027</td>
                        <td className="p-2">Yes</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-100">Emzor Paracetamol 500mg</td>
                        <td className="p-2 border-r border-slate-100">Paracetamol</td>
                        <td className="p-2 border-r border-slate-100">Analgesics & Pain</td>
                        <td className="p-2 border-r border-slate-100">Tablet</td>
                        <td className="p-2 font-bold text-emerald-700 border-r border-slate-100">800</td>
                        <td className="p-2 border-r border-slate-100">500</td>
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-800">250</td>
                        <td className="p-2 border-r border-slate-100">8</td>
                        <td className="p-2 border-r border-slate-100">2028</td>
                        <td className="p-2">No</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-100">Coartem 80/480mg</td>
                        <td className="p-2 border-r border-slate-100">Artemether / Lumefantrine</td>
                        <td className="p-2 border-r border-slate-100">Antimalarial</td>
                        <td className="p-2 border-r border-slate-100">Tablet</td>
                        <td className="p-2 font-bold text-emerald-700 border-r border-slate-100">3200</td>
                        <td className="p-2 border-r border-slate-100">2400</td>
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-800">75</td>
                        <td className="p-2 border-r border-slate-100">10</td>
                        <td className="p-2 border-r border-slate-100">2027</td>
                        <td className="p-2">No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload Dropzone & File Input */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Select or Drop Your Excel / CSV File
                </h4>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingBulk(true);
                  }}
                  onDragLeave={() => setIsDraggingBulk(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingBulk(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                  onClick={() => modalFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDraggingBulk
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50 bg-white"
                  }`}
                >
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessFile(file);
                    }}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0a4738] flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {bulkFile ? bulkFile.name : "Click to browse or drag & drop your spreadsheet"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message Display */}
              {bulkError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Upload Error:</span> {bulkError}
                  </div>
                </div>
              )}

              {/* Parsed Verification Preview */}
              {parsedBulkProducts.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-950">
                        Spreadsheet Verified: {parsedBulkProducts.length} Product{parsedBulkProducts.length === 1 ? "" : "s"} Ready to Import
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                      Valid Structure
                    </span>
                  </div>

                  {/* Quick table preview of top 4 parsed items */}
                  <div className="max-h-40 overflow-y-auto border border-emerald-200 rounded-xl bg-white">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Molecule</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedBulkProducts.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{p.name}</td>
                            <td className="p-2 text-slate-500">{p.api_molecule}</td>
                            <td className="p-2 text-slate-500">{p.category}</td>
                            <td className="p-2 font-mono font-bold text-emerald-700">{p.quantity}</td>
                            <td className="p-2 font-mono font-bold text-slate-900">₦{p.price.toLocaleString("en-NG")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedBulkProducts.length > 5 && (
                    <p className="text-[11px] text-emerald-700 italic">
                      + and {parsedBulkProducts.length - 5} more products will be indexed into active stock.
                    </p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleCloseBulkModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm cursor-pointer text-center"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  disabled={parsedBulkProducts.length === 0}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    parsedBulkProducts.length > 0
                      ? "bg-[#0a4738] hover:bg-[#145a49] text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Import {parsedBulkProducts.length > 0 ? `${parsedBulkProducts.length} Products` : "Products"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
