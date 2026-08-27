import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  ArrowRight,
  Sparkles,
  Package,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown
} from "lucide-react";
import { Product, CartItem, SaleRecord } from "../types";
import { DRUG_CATEGORIES } from "../data/initialData";

interface POSDeskProps {
  products: Product[];
  onCompleteSale: (sale: Omit<SaleRecord, "id" | "timestamp">) => void;
  onRequestAiConsult: (product: Product) => void;
  cashierName: string;
  pharmacyId: string;
}

export const POSDesk: React.FC<POSDeskProps> = ({
  products,
  onCompleteSale,
  onRequestAiConsult,
  cashierName,
  pharmacyId
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const POS_VIEW_LIMIT = 5;

  // Split payment state
  const [cashAmount, setCashAmount] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Filter products for POS
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "All Categories" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.api_molecule.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / POS_VIEW_LIMIT));
  const currentSafePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (currentSafePage - 1) * POS_VIEW_LIMIT;
    return filteredProducts.slice(start, start + POS_VIEW_LIMIT);
  }, [filteredProducts, currentSafePage]);

  // Swipe handlers for mobile / touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    // Threshold of 50px for vertical swipe
    if (diffY > 50) {
      // Swiped UP -> Next 5 products
      if (currentSafePage < totalPages) {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (diffY < -50) {
      // Swiped DOWN -> Previous 5 products
      if (currentSafePage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    touchStartY.current = null;
  };

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const numCash = parseFloat(cashAmount) || 0;
  const numTransfer = parseFloat(transferAmount) || 0;
  const numCard = parseFloat(cardAmount) || 0;
  const totalPaid = numCash + numTransfer + numCard;
  const changeDue = Math.max(0, totalPaid - cartTotal);
  const remainingDue = Math.max(0, cartTotal - totalPaid);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashAmount("");
    setTransferAmount("");
    setCardAmount("");
    setCustomerPhone("");
    setCustomerName("");
    setPaymentError(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setPaymentError("Cart is empty. Select products first.");
      return;
    }

    if (totalPaid < cartTotal) {
      setPaymentError(
        `Insufficient payment. Total is ₦${cartTotal.toLocaleString()} but only ₦${totalPaid.toLocaleString()} was entered.`
      );
      return;
    }

    let method: "Cash" | "Transfer" | "Card" | "Split" = "Cash";
    if (numCash > 0 && numTransfer === 0 && numCard === 0) method = "Cash";
    else if (numTransfer > 0 && numCash === 0 && numCard === 0) method = "Transfer";
    else if (numCard > 0 && numCash === 0 && numTransfer === 0) method = "Card";
    else method = "Split";

    onCompleteSale({
      items: cart,
      total: cartTotal,
      cashPaid: numCash,
      transferPaid: numTransfer,
      cardPaid: numCard,
      changeDue,
      cashierName,
      pharmacyId,
      customerPhone: customerPhone.trim() || undefined,
      customerName: customerName.trim() || undefined,
      paymentMethod: method
    });

    clearCart();
  };

  const setExactCash = () => {
    setCashAmount(cartTotal.toString());
    setTransferAmount("");
    setCardAmount("");
    setPaymentError(null);
  };

  const setExactTransfer = () => {
    setTransferAmount(cartTotal.toString());
    setCashAmount("");
    setCardAmount("");
    setPaymentError(null);
  };

  const setExactCard = () => {
    setCardAmount(cartTotal.toString());
    setCashAmount("");
    setTransferAmount("");
    setPaymentError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Product Catalog Column */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search & Filter Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                POS Dispense Desk
              </h2>
              <p className="text-sm text-slate-500">
                Dispense medicines and process client checkout instantly
              </p>
            </div>
            
            {/* Category selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {DRUG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, active ingredient / molecule, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 5-Product View Bar & Swipe Instructions */}
        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-4 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Showing {filteredProducts.length === 0 ? 0 : (currentSafePage - 1) * POS_VIEW_LIMIT + 1}–
              {Math.min(currentSafePage * POS_VIEW_LIMIT, filteredProducts.length)} of {filteredProducts.length} Products
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowUpDown className="w-3 h-3" /> Swipe / Scroll
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentSafePage > 1) {
                  setCurrentPage((p) => p - 1);
                  scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentSafePage <= 1}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous 5 products"
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
                  scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentSafePage >= totalPages}
              className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next 5 products"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Grid (Reduced to 5 per view with swipe support) */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="space-y-3 max-h-[calc(100vh-340px)] min-h-[380px] overflow-y-auto pr-1 touch-pan-y overscroll-contain transition-all"
        >
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No products found matching your search</p>
              <p className="text-sm text-slate-400 mt-1">Try another search term or clear the category filter.</p>
            </div>
          ) : (
            paginatedProducts.map((p) => {
              const inCart = cart.find((item) => item.product.id === p.id);
              const remainingStock = p.quantity - (inCart ? inCart.quantity : 0);
              const isOutOfStock = remainingStock <= 0;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOutOfStock
                      ? "border-slate-200 opacity-60 bg-slate-50"
                      : "border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 leading-snug truncate">{p.name}</h3>
                      {p.pom && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          POM
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {p.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{p.api_molecule}</p>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-slate-400 font-mono">
                        {p.drug_type}
                      </span>
                      <span
                        className={`font-semibold ${
                          remainingStock <= p.low_stock_threshold
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : `${remainingStock} available`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₦{p.price.toLocaleString("en-NG")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRequestAiConsult(p)}
                        title="AI Clinical & Price Consult"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                      </button>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-all ${
                          isOutOfStock
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:scale-[1.02]"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Page Navigator */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto py-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => {
                  setCurrentPage(num);
                  scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                  currentSafePage === num
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart & Checkout Column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Active Dispense Cart
              </h3>
              <p className="text-xs text-slate-500">
                {cart.length} item{cart.length === 1 ? "" : "s"} selected
              </p>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs text-slate-400 mt-0.5">Click "Add" on any product to begin sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ₦{item.product.price.toLocaleString()} × {item.quantity} ={" "}
                      <span className="font-bold text-slate-800">
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-slate-900 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.quantity}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Total Display */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-900">Total Payable:</span>
            <span className="text-2xl font-bold text-emerald-900 font-mono">
              ₦{cartTotal.toLocaleString("en-NG")}
            </span>
          </div>

          {/* Customer info (Optional) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Walk-in Client"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Phone for SMS Receipt
              </label>
              <input
                type="tel"
                placeholder="+234..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Split Payment Entry
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={setExactCash}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  All Cash
                </button>
                <button
                  type="button"
                  onClick={setExactTransfer}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  All Transfer
                </button>
                <button
                  type="button"
                  onClick={setExactCard}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  All POS Card
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  Cash (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cashAmount}
                  onChange={(e) => {
                    setCashAmount(e.target.value);
                    setPaymentError(null);
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
                  Transfer (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => {
                    setTransferAmount(e.target.value);
                    setPaymentError(null);
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  Card (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cardAmount}
                  onChange={(e) => {
                    setCardAmount(e.target.value);
                    setPaymentError(null);
                  }}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Payment balance indicator */}
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-100 font-medium">
              <span className="text-slate-600">Total Tendered: ₦{totalPaid.toLocaleString()}</span>
              {remainingDue > 0 ? (
                <span className="text-amber-700 font-semibold">
                  ₦{remainingDue.toLocaleString()} pending
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">
                  Change: ₦{changeDue.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Complete Transaction Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              cart.length === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            Complete Sale & Issue Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
