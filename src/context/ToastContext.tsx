import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastNotification, ToastType } from "../types";

interface ToastContextType {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  notifyProductAdded: (product: {
    name: string;
    quantity: number;
    price: number;
    drug_type?: string;
  }) => void;
  notifyCheckout: (sale: {
    receiptId: string;
    total: number;
    itemsCount: number;
    paymentMethod?: string;
    customerName?: string;
  }) => void;
  notifyUpload: (
    title: string,
    message: string,
    details?: { count?: number; fileName?: string }
  ) => void;
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastNotification, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const durationMs = toast.durationMs ?? 4500;

      const newToast: ToastNotification = {
        ...toast,
        id,
        durationMs
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep maximum 5 active toasts

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }

      return id;
    },
    [removeToast]
  );

  const notifyProductAdded = useCallback(
    (product: {
      name: string;
      quantity: number;
      price: number;
      drug_type?: string;
    }) => {
      addToast({
        type: "product_added",
        title: "Product Added to Inventory",
        message: `${product.name} is now available in your active stock catalog.`,
        details: {
          productName: product.name,
          quantity: product.quantity,
          price: product.price
        },
        durationMs: 5000
      });
    },
    [addToast]
  );

  const notifyCheckout = useCallback(
    (sale: {
      receiptId: string;
      total: number;
      itemsCount: number;
      paymentMethod?: string;
      customerName?: string;
    }) => {
      addToast({
        type: "checkout",
        title: "POS Checkout Completed",
        message: `Receipt #${sale.receiptId} finalized for ${sale.customerName || "Walk-in Customer"}.`,
        details: {
          receiptId: sale.receiptId,
          totalAmount: sale.total,
          itemsCount: sale.itemsCount,
          paymentMethod: sale.paymentMethod
        },
        durationMs: 5500
      });
    },
    [addToast]
  );

  const notifyUpload = useCallback(
    (
      title: string,
      message: string,
      details?: { count?: number; fileName?: string }
    ) => {
      addToast({
        type: "upload",
        title,
        message,
        details: {
          count: details?.count,
          fileName: details?.fileName
        },
        durationMs: 5000
      });
    },
    [addToast]
  );

  const notifySuccess = useCallback(
    (title: string, message?: string) => {
      addToast({
        type: "success",
        title,
        message,
        durationMs: 4000
      });
    },
    [addToast]
  );

  const notifyError = useCallback(
    (title: string, message?: string) => {
      addToast({
        type: "error",
        title,
        message,
        durationMs: 6000
      });
    },
    [addToast]
  );

  const notifyInfo = useCallback(
    (title: string, message?: string) => {
      addToast({
        type: "info",
        title,
        message,
        durationMs: 4000
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        notifyProductAdded,
        notifyCheckout,
        notifyUpload,
        notifySuccess,
        notifyError,
        notifyInfo
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
