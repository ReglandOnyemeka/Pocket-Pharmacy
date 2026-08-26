import React, { useState } from "react";
import {
  Receipt,
  Printer,
  Send,
  Download,
  X,
  CheckCircle2,
  Phone,
  Building2
} from "lucide-react";
import { ReceiptData } from "../types";

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    let text = `====================================\n`;
    text += `       ${receipt.pharmacyName.toUpperCase()}\n`;
    text += `       ${receipt.pharmacyLocation}\n`;
    text += `       Tel: ${receipt.pharmacyPhone}\n`;
    text += `====================================\n`;
    text += `Receipt ID: ${receipt.receiptId}\n`;
    text += `Date: ${receipt.date}\n`;
    text += `Cashier: ${receipt.cashier}\n`;
    text += `------------------------------------\n`;
    receipt.items.forEach((item) => {
      text += `${item.product.name} x${item.quantity}\n`;
      text += `  @ ₦${item.product.price.toLocaleString()} = ₦${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    text += `------------------------------------\n`;
    text += `TOTAL PAYABLE:    ₦${receipt.total.toLocaleString("en-NG")}\n`;
    if (receipt.cashPaid > 0) text += `Cash Tendered:    ₦${receipt.cashPaid.toLocaleString()}\n`;
    if (receipt.transferPaid > 0) text += `Transfer:         ₦${receipt.transferPaid.toLocaleString()}\n`;
    if (receipt.cardPaid > 0) text += `POS Card:         ₦${receipt.cardPaid.toLocaleString()}\n`;
    if (receipt.change > 0) text += `Change Returned:  ₦${receipt.change.toLocaleString()}\n`;
    text += `====================================\n`;
    text += ` Thank you for your patronage!\n`;
    text += ` Quick recovery and good health.\n`;
    text += `====================================\n`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${receipt.receiptId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone.trim()) return;
    setSmsSentNotice(true);
    setTimeout(() => {
      setSmsSentNotice(false);
      setSmsPhone("");
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900">Dispense Receipt</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 space-y-4 font-mono text-xs">
          <div className="text-center space-y-1 pb-3 border-b border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-wider uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Pocket Pharmacy Official Dispense
            </div>
            <h4 className="font-bold text-sm text-slate-900">{receipt.pharmacyName}</h4>
            <p className="text-slate-500">{receipt.pharmacyLocation}</p>
            <p className="text-slate-500">Tel: {receipt.pharmacyPhone}</p>
          </div>

          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>Ref: {receipt.receiptId}</span>
            <span>{receipt.date}</span>
          </div>

          <div className="text-slate-600 text-[11px]">
            <span>Cashier: {receipt.cashier}</span>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-200 divide-dashed py-2">
            {receipt.items.map((item) => (
              <div key={item.product.id} className="py-2 flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-slate-900">{item.product.name}</p>
                  <p className="text-slate-500 text-[10px]">
                    ₦{item.product.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-slate-900">
                  ₦{(item.product.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Total & breakdown */}
          <div className="pt-2 border-t border-slate-200 border-dashed space-y-1">
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>TOTAL</span>
              <span>₦{receipt.total.toLocaleString("en-NG")}</span>
            </div>

            {receipt.cashPaid > 0 && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Cash Paid</span>
                <span>₦{receipt.cashPaid.toLocaleString()}</span>
              </div>
            )}
            {receipt.transferPaid > 0 && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Transfer Paid</span>
                <span>₦{receipt.transferPaid.toLocaleString()}</span>
              </div>
            )}
            {receipt.cardPaid > 0 && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>POS Card Paid</span>
                <span>₦{receipt.cardPaid.toLocaleString()}</span>
              </div>
            )}
            {receipt.change > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                <span>Change Returned</span>
                <span>₦{receipt.change.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* SMS Digital Delivery */}
        <form onSubmit={handleSendSms} className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Send SMS Receipt to Customer
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="+234..."
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch SMS
            </button>
          </div>
          {smsSentNotice && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Digital SMS receipt dispatched!
            </p>
          )}
        </form>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={handleDownloadTxt}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Download TXT
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
