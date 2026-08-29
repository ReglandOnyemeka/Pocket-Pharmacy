import React from "react";
import {
  CheckCircle2,
  PackagePlus,
  ShoppingBag,
  CloudUpload,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Receipt,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { ToastNotification } from "../types";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, clearAllToasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 flex flex-col gap-2.5 max-w-[94vw] sm:max-w-md w-full pointer-events-none select-none"
    >
      {toasts.length > 1 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            type="button"
            onClick={clearAllToasts}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all cursor-pointer"
          >
            Clear all ({toasts.length})
          </button>
        </div>
      )}

      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{
  toast: ToastNotification;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const { type, title, message, details, durationMs = 4500 } = toast;

  // Icon, color scheme, and badges based on notification type
  const getToastConfig = () => {
    switch (type) {
      case "checkout":
        return {
          icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
          accentBg: "bg-emerald-50 border-emerald-200/80",
          iconBg: "bg-emerald-100 text-emerald-700",
          tagBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          progressBarBg: "bg-emerald-500",
          badgeLabel: "Sale Finalized"
        };
      case "product_added":
        return {
          icon: <PackagePlus className="w-5 h-5 text-[#0a4738]" />,
          accentBg: "bg-emerald-50/90 border-[#3be8b0]/50",
          iconBg: "bg-[#0a4738] text-[#3be8b0]",
          tagBg: "bg-emerald-100 text-emerald-900 border-emerald-200",
          progressBarBg: "bg-[#0a4738]",
          badgeLabel: "Catalog Updated"
        };
      case "upload":
        return {
          icon: <CloudUpload className="w-5 h-5 text-teal-600" />,
          accentBg: "bg-teal-50/90 border-teal-200/80",
          iconBg: "bg-teal-100 text-teal-700",
          tagBg: "bg-teal-100 text-teal-800 border-teal-200",
          progressBarBg: "bg-teal-500",
          badgeLabel: "Upload Complete"
        };
      case "error":
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          accentBg: "bg-red-50/90 border-red-200/80",
          iconBg: "bg-red-100 text-red-700",
          tagBg: "bg-red-100 text-red-800 border-red-200",
          progressBarBg: "bg-red-500",
          badgeLabel: "Error"
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          accentBg: "bg-amber-50/90 border-amber-200/80",
          iconBg: "bg-amber-100 text-amber-700",
          tagBg: "bg-amber-100 text-amber-800 border-amber-200",
          progressBarBg: "bg-amber-500",
          badgeLabel: "Warning"
        };
      case "info":
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          accentBg: "bg-blue-50/90 border-blue-200/80",
          iconBg: "bg-blue-100 text-blue-700",
          tagBg: "bg-blue-100 text-blue-800 border-blue-200",
          progressBarBg: "bg-blue-500",
          badgeLabel: "Info"
        };
      case "success":
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          accentBg: "bg-emerald-50/90 border-emerald-200/80",
          iconBg: "bg-emerald-100 text-emerald-700",
          tagBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          progressBarBg: "bg-emerald-500",
          badgeLabel: "Success"
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      role="alert"
      className={`pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-200 animate-in slide-in-from-top-3 sm:slide-in-from-right-3 ${config.accentBg}`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          
          {/* Icon Badge */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center font-bold shadow-xs ${config.iconBg}`}
          >
            {config.icon}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {title}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border tracking-wider leading-none ${config.tagBg}`}
              >
                {config.badgeLabel}
              </span>
            </div>

            {message && (
              <p className="text-xs text-slate-600 mt-1 leading-snug break-words">
                {message}
              </p>
            )}

            {/* Custom Structured Details Pill Container */}
            {details && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs">
                {/* Checkout Specific Details */}
                {details.receiptId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100/90 text-emerald-900 font-mono font-bold text-[11px] border border-emerald-200">
                    <Receipt className="w-3 h-3 text-emerald-700" />
                    {details.receiptId}
                  </span>
                )}
                {details.totalAmount !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-700 text-white font-mono font-black text-[11px] shadow-xs">
                    ₦{details.totalAmount.toLocaleString("en-NG")}
                  </span>
                )}
                {details.itemsCount !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                    {details.itemsCount} SKU{details.itemsCount === 1 ? "" : "s"}
                  </span>
                )}

                {/* Product Added Specific Details */}
                {details.productName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#0a4738] text-white font-bold text-[11px]">
                    {details.productName}
                  </span>
                )}
                {details.quantity !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                    Stock: {details.quantity} units
                  </span>
                )}
                {details.price !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px] border border-slate-200">
                    ₦{details.price.toLocaleString("en-NG")}
                  </span>
                )}

                {/* Upload Specific Details */}
                {details.count !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200">
                    <FileSpreadsheet className="w-3 h-3 text-teal-700" />
                    {details.count} Products Imported
                  </span>
                )}
                {details.fileName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-mono truncate max-w-[150px] border border-slate-200">
                    {details.fileName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-Dismiss Animated Progress Bar Line */}
      {durationMs > 0 && (
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div
            className={`h-full ${config.progressBarBg} opacity-80`}
            style={{
              animation: `toast-progress ${durationMs}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};
