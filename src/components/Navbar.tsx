import React, { useState } from "react";
import {
  ShieldAlert,
  Shield,
  User,
  LogOut,
  Sparkles,
  CloudUpload,
  CheckCircle,
  ShoppingBag,
  Package,
  Layers
} from "lucide-react";
import { Pharmacy, AppUser, UserRole } from "../types";
import { PocketPharmacyLogo } from "./PocketPharmacyLogo";

interface NavbarProps {
  currentPharmacy: Pharmacy;
  currentUser: AppUser | null;
  currentRole: UserRole;
  activeTab: "pos" | "inventory" | "alerts" | "ai_consult" | "admin";
  setActiveTab: (tab: "pos" | "inventory" | "alerts" | "ai_consult" | "admin") => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onTriggerBackup: () => Promise<void>;
  lastBackupTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPharmacy,
  currentUser,
  currentRole,
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onLogout,
  onTriggerBackup,
  lastBackupTime
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessAnim, setBackupSuccessAnim] = useState(false);

  const handleBackupClick = async () => {
    setIsBackingUp(true);
    try {
      await onTriggerBackup();
      setBackupSuccessAnim(true);
      setTimeout(() => setBackupSuccessAnim(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-400/20 text-[#3be8b0] border border-[#3be8b0]/40">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3be8b0]" />
            Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Shield className="w-3.5 h-3.5" />
            Admin / Pharmacist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <User className="w-3.5 h-3.5" />
            Cashier
          </span>
        );
    }
  };

  return (
    <header className="bg-[#0a4738] border-b border-[#145a49] text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Brand & Pharmacy Identity with Original Pocket Pharmacy Logo */}
          <div className="flex items-center gap-3">
            <PocketPharmacyLogo
              size="md"
              variant="dark"
              tenantName={currentPharmacy.name}
              tenantLocation={currentPharmacy.location}
              showTenantSubtitle={true}
            />
          </div>

          {/* Center Actions: Primary Navigation Buttons */}
          <nav className="hidden lg:flex items-center gap-2 bg-[#063327]/80 p-2 rounded-2xl border border-[#145a49] shadow-inner">
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-base font-bold transition-all ${
                activeTab === "pos"
                  ? "bg-[#145a49] text-white shadow-lg shadow-black/40 ring-2 ring-[#3be8b0] scale-[1.02]"
                  : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-[#3be8b0]" />
              POS
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-base font-bold transition-all ${
                activeTab === "inventory"
                  ? "bg-[#145a49] text-white shadow-lg shadow-black/40 ring-2 ring-[#3be8b0] scale-[1.02]"
                  : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
              }`}
            >
              <Package className="w-5 h-5 text-[#3be8b0]" />
              Inventory
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-base font-bold transition-all ${
                activeTab === "alerts"
                  ? "bg-[#145a49] text-white shadow-lg shadow-black/40 ring-2 ring-[#3be8b0] scale-[1.02]"
                  : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
              }`}
            >
              <Layers className="w-5 h-5 text-[#3be8b0]" />
              Alerts
            </button>

            <button
              onClick={() => setActiveTab("ai_consult")}
              className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-base font-bold transition-all ${
                activeTab === "ai_consult"
                  ? "bg-[#145a49] text-white shadow-lg shadow-black/40 ring-2 ring-[#3be8b0] scale-[1.02]"
                  : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
              }`}
            >
              <Sparkles className="w-5 h-5 text-[#3be8b0]" />
              AI Intelligence
            </button>

            {(currentRole === "super_admin" || currentRole === "admin") && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === "admin"
                    ? "bg-[#3be8b0] text-[#0a4738] shadow-lg shadow-black/40 ring-2 ring-white scale-[1.02] font-black"
                    : "text-[#3be8b0] hover:text-white hover:bg-[#145a49]/60"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                Super Admin
              </button>
            )}
          </nav>

          {/* Right Area: Database Backup Button & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Backup Database Button */}
            <div className="flex flex-col items-end">
              <button
                onClick={handleBackupClick}
                disabled={isBackingUp}
                title="Save & backup this pharmacy's database to encrypted cloud & local storage"
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-sm ${
                  backupSuccessAnim
                    ? "bg-emerald-600 text-white border-emerald-400"
                    : isBackingUp
                    ? "bg-[#063327] text-emerald-200 border-[#145a49] cursor-wait"
                    : "bg-[#145a49] hover:bg-[#1b6b57] text-white border-[#227a64]"
                }`}
              >
                {backupSuccessAnim ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className={`w-4 h-4 text-[#3be8b0] ${isBackingUp ? "animate-spin" : ""}`} />
                    <span className="hidden md:inline">{isBackingUp ? "Saving..." : "Save Data"}</span>
                  </>
                )}
              </button>

              {lastBackupTime && (
                <span className="hidden xl:block text-[10px] text-emerald-200/60 mt-0.5 font-mono">
                  Saved {new Date(lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Active User Badge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                {currentUser?.name || "Active Staff"}
              </span>
              {getRoleBadge()}
            </div>

            {/* Switch User Button */}
            <button
              onClick={onOpenAuthModal}
              title="Switch user or tenant pharmacy"
              className="p-2.5 rounded-xl bg-[#145a49] hover:bg-[#1b6b57] border border-[#227a64] text-slate-100 hover:text-white transition-all flex items-center justify-center"
            >
              <User className="w-4 h-4 text-[#3be8b0]" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/50 text-red-200 transition-all flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Row with Prominent Buttons */}
        <div className="lg:hidden flex items-center justify-between gap-1.5 py-3 border-t border-[#145a49] overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 font-bold transition-all ${
              activeTab === "pos"
                ? "bg-[#145a49] text-white shadow-md ring-1 ring-[#3be8b0]"
                : "bg-[#063327] text-emerald-100/80"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#3be8b0]" /> POS
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 font-bold transition-all ${
              activeTab === "inventory"
                ? "bg-[#145a49] text-white shadow-md ring-1 ring-[#3be8b0]"
                : "bg-[#063327] text-emerald-100/80"
            }`}
          >
            <Package className="w-4 h-4 text-[#3be8b0]" /> Inventory
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 font-bold transition-all ${
              activeTab === "alerts"
                ? "bg-[#145a49] text-white shadow-md ring-1 ring-[#3be8b0]"
                : "bg-[#063327] text-emerald-100/80"
            }`}
          >
            <Layers className="w-4 h-4 text-[#3be8b0]" /> Alerts
          </button>
          <button
            onClick={() => setActiveTab("ai_consult")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 font-bold transition-all ${
              activeTab === "ai_consult"
                ? "bg-[#145a49] text-white shadow-md ring-1 ring-[#3be8b0]"
                : "bg-[#063327] text-emerald-100/80"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#3be8b0]" /> AI Intelligence
          </button>
          {(currentRole === "super_admin" || currentRole === "admin") && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 font-bold transition-all ${
                activeTab === "admin"
                  ? "bg-[#3be8b0] text-[#0a4738] shadow-md ring-1 ring-white"
                  : "bg-[#063327] text-[#3be8b0] border border-[#3be8b0]/40"
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Super Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
