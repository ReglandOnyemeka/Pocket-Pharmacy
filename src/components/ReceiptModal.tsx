import React, { useState } from "react";
import {
  Receipt,
  Printer,
  Send,
  Download,
  X,
  CheckCircle2,
  Phone,
  MessageCircle,
  Heart,
  Sparkles
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
    text += `Dispensed by: ${receipt.cashier}\n`;
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
    text += ` Thank you for trusting ${receipt.pharmacyName}!\n`;
    text += ` Wishing you or your family a quick & full recovery.\n`;
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

  // WhatsApp share link generator
  const generateWhatsAppMessage = () => {
    let msg = `🌿 *${receipt.pharmacyName} — Official Dispense Receipt*\n`;
    msg += `📍 ${receipt.pharmacyLocation} (Tel: ${receipt.pharmacyPhone})\n`;
    msg += `Receipt Ref: #${receipt.receiptId}\n`;
    msg += `Date: ${receipt.date}\n`;
    msg += `Dispensed by: ${receipt.cashier}\n\n`;
    msg += `*Items Dispensed:*\n`;
    receipt.items.forEach((item) => {
      msg += `• ${item.product.name} (Qty: ${item.quantity}) - ₦${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    msg += `\n*Total Amount Paid: ₦${receipt.total.toLocaleString("en-NG")}*\n\n`;
    msg += `_Thank you for visiting us. Wishing you a peaceful & speedy recovery!_\n`;
    return encodeURIComponent(msg);
  };

  const targetPhone = smsPhone.trim() || receipt.pharmacyPhone;
  const whatsappUrl = `https://wa.me/?text=${generateWhatsAppMessage()}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0a4738] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">Dispense & Care Receipt</h3>
              <p className="text-[11px] text-slate-400">Ref: #{receipt.receiptId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Receipt Simulation */}
        <div className="bg-[#fcfdfc] p-5 rounded-2xl border border-slate-200 text-slate-800 space-y-4 font-mono text-xs shadow-xs">
          <div className="text-center space-y-1 pb-3 border-b border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0a4738] text-[10px] font-black tracking-wider uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Official Pharmacy Dispense
            </div>
            <h4 className="font-bold text-sm text-slate-900 font-sans">{receipt.pharmacyName}</h4>
            <p className="text-slate-500 text-[11px]">{receipt.pharmacyLocation}</p>
            <p className="text-slate-500 text-[11px]">Tel: {receipt.pharmacyPhone}</p>
          </div>

          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>Ref: {receipt.receiptId}</span>
            <span>{receipt.date}</span>
          </div>

          <div className="text-slate-600 text-[11px]">
            <span>Dispensed with care by: <strong className="text-slate-800">{receipt.cashier}</strong></span>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-200 divide-dashed py-2">
            {receipt.items.map((item) => (
              <div key={item.product.id} className="py-2 flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-slate-900 font-sans">{item.product.name}</p>
                  <p className="text-slate-500 text-[10px]">
                    ₦{item.product.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-slate-900 font-sans">
                  ₦{(item.product.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Total & breakdown */}
          <div className="pt-2 border-t border-slate-200 border-dashed space-y-1">
            <div className="flex justify-between text-sm font-bold text-slate-900 font-sans">
              <span>TOTAL PAID</span>
              <span className="text-[#0a4738] font-mono">₦{receipt.total.toLocaleString("en-NG")}</span>
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

          {/* Warm Well-Wishes Footer */}
          <div className="pt-3 border-t border-slate-200 border-dashed text-center text-[10px] text-slate-500 font-sans">
            <p className="font-semibold text-emerald-800 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              Wishing you a swift and complete recovery!
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Please take all medications strictly according to dosage instructions.
            </p>
          </div>
        </div>

        {/* WhatsApp & SMS Sharing Options */}
        <div className="space-y-2 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Share Receipt via WhatsApp
          </a>

          <form onSubmit={handleSendSms} className="flex gap-2">
            <input
              type="tel"
              placeholder="Enter phone (e.g. 0803...)"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0a4738]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#0a4738] hover:bg-[#145a49] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch SMS
            </button>
          </form>

          {smsSentNotice && (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Digital SMS receipt dispatched successfully!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={handleDownloadTxt}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Download TXT
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#0a4738] hover:bg-[#145a49] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Thermal Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
