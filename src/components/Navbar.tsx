import React, { useState } from "react";
import {
  ShieldAlert,
  Shield,
  User,
  LogOut,
  Activity,
  Zap,
  CloudUpload,
  CheckCircle,
  ShoppingBag,
  Package,
  Layers,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Store,
  Clock
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBackupClick = async () => {
    setIsBackingUp(true);
    try {
      await onTriggerBackup();
      setBackupSuccessAnim(true);
      setTimeout(() => setBackupSuccessAnim(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const getFirstName = () => {
    if (!currentUser) return "Team";
    const name = (currentUser.fullName || currentUser.username || "").trim();
    if (!name) return "Team";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1 && /^(pharm\.?|dr\.?|mr\.?|mrs\.?|ms\.?|pharmacist)$/i.test(parts[0])) {
      return parts[1];
    }
    return parts[0];
  };

  const handleSelectTab = (tab: "pos" | "inventory" | "alerts" | "ai_consult" | "admin") => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-[#0a4738] border-b border-[#145a49] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Brand & Pharmacy Identity with Pocket Pharmacy Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <PocketPharmacyLogo
                size="md"
                variant="dark"
                tenantName={currentPharmacy.name}
                tenantLocation={currentPharmacy.location}
                showTenantSubtitle={true}
              />
            </div>

            {/* Desktop Navigation: Primary Navigation Buttons (lg screens and above) */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-[#063327]/80 p-1.5 rounded-xl border border-[#145a49] shadow-inner">
              <button
                onClick={() => setActiveTab("pos")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "pos"
                    ? "bg-[#145a49] text-white shadow-md ring-2 ring-[#3be8b0]"
                    : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#3be8b0]" />
                POS
              </button>

              <button
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-[#145a49] text-white shadow-md ring-2 ring-[#3be8b0]"
                    : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
                }`}
              >
                <Package className="w-4 h-4 text-[#3be8b0]" />
                Inventory
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "alerts"
                    ? "bg-[#145a49] text-white shadow-md ring-2 ring-[#3be8b0]"
                    : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
                }`}
              >
                <Layers className="w-4 h-4 text-[#3be8b0]" />
                Alerts
              </button>

              <button
                onClick={() => setActiveTab("ai_consult")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "ai_consult"
                    ? "bg-[#145a49] text-white shadow-md ring-2 ring-[#3be8b0]"
                    : "text-emerald-100/90 hover:text-white hover:bg-[#0e4d3c]"
                }`}
              >
                <Zap className="w-4 h-4 text-[#3be8b0] fill-[#3be8b0]" />
                Pharventory
              </button>

              {(currentRole === "super_admin" || currentRole === "admin") && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "admin"
                      ? "bg-[#3be8b0] text-[#0a4738] shadow-md ring-2 ring-white font-black"
                      : "text-[#3be8b0] hover:text-white hover:bg-[#145a49]/60"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Super Admin
                </button>
              )}
            </nav>

            {/* Right Area: Fast Save Data Button, User Profile & Mobile Toggle Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Backup Database Button */}
              <div className="flex flex-col items-end">
                <button
                  onClick={handleBackupClick}
                  disabled={isBackingUp}
                  title="Save & backup database instantly"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
                    backupSuccessAnim
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : isBackingUp
                      ? "bg-[#063327] text-emerald-200 border-[#145a49] cursor-wait"
                      : "bg-[#145a49] hover:bg-[#1b6b57] text-white border-[#227a64]"
                  }`}
                >
                  {backupSuccessAnim ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                      <span className="hidden xs:inline sm:inline">Saved!</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className={`w-3.5 h-3.5 text-[#3be8b0] ${isBackingUp ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">{isBackingUp ? "Saving..." : "Save Data"}</span>
                    </>
                  )}
                </button>

                {lastBackupTime && (
                  <span className="hidden xl:block text-[10px] text-emerald-200/60 mt-0.5 font-mono">
                    Saved {new Date(lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* User Greeting & Quick In-Place Logout (desktop/tablet) */}
              <div className="hidden sm:flex flex-col items-end justify-center">
                <span className="text-xs font-medium text-emerald-200/90 leading-tight">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return "Good morning,";
                    if (hour < 17) return "Good afternoon,";
                    return "Good evening,";
                  })()}{" "}
                  <span className="font-bold text-white text-xs sm:text-sm">{getFirstName()}</span>
                </span>
                
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-200 hover:text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                className={`lg:hidden flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer shadow-xs ${
                  isMobileMenuOpen
                    ? "bg-[#3be8b0] text-[#0a4738] border-white scale-105"
                    : "bg-[#063327] text-white border-[#145a49] hover:bg-[#0e4d3c]"
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Mobile Toggle Menu Overlay Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#145a49] bg-[#07382c] px-3.5 py-3 space-y-2.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
            
            {/* Pharmacy & User Status Banner */}
            <div className="bg-[#052b22] px-3 py-2 rounded-xl border border-[#145a49] flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="font-bold text-white text-xs truncate">
                  {currentPharmacy.name}
                </p>
                <p className="text-[11px] text-emerald-200/70 truncate">
                  {currentPharmacy.location} • {getFirstName()}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="px-2 py-1 rounded-lg bg-[#145a49] hover:bg-[#1b6b57] border border-[#227a64] text-[11px] font-semibold text-emerald-100 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Store className="w-3 h-3 text-[#3be8b0]" />
                <span>Switch</span>
              </button>
            </div>

            {/* Main Menu Toggle Navigation Buttons (Without descriptions, compact sized) */}
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => handleSelectTab("pos")}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                  activeTab === "pos"
                    ? "bg-[#145a49] border-[#3be8b0] text-white shadow-xs ring-1 ring-[#3be8b0]"
                    : "bg-[#063327] border-[#145a49]/60 text-emerald-100/90 hover:bg-[#0e4d3c]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#3be8b0] flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white">POS</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                onClick={() => handleSelectTab("inventory")}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-[#145a49] border-[#3be8b0] text-white shadow-xs ring-1 ring-[#3be8b0]"
                    : "bg-[#063327] border-[#145a49]/60 text-emerald-100/90 hover:bg-[#0e4d3c]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#3be8b0] flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white">Inventory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                onClick={() => handleSelectTab("alerts")}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                  activeTab === "alerts"
                    ? "bg-[#145a49] border-[#3be8b0] text-white shadow-xs ring-1 ring-[#3be8b0]"
                    : "bg-[#063327] border-[#145a49]/60 text-emerald-100/90 hover:bg-[#0e4d3c]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#3be8b0] flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white">Alerts</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                onClick={() => handleSelectTab("ai_consult")}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                  activeTab === "ai_consult"
                    ? "bg-[#145a49] border-[#3be8b0] text-white shadow-xs ring-1 ring-[#3be8b0]"
                    : "bg-[#063327] border-[#145a49]/60 text-emerald-100/90 hover:bg-[#0e4d3c]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#3be8b0] flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4 fill-[#3be8b0]" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white">Pharventory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {(currentRole === "super_admin" || currentRole === "admin") && (
                <button
                  onClick={() => handleSelectTab("admin")}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                    activeTab === "admin"
                      ? "bg-[#3be8b0] text-[#0a4738] border-white shadow-xs font-bold"
                      : "bg-[#063327] border-[#3be8b0]/40 text-[#3be8b0] hover:bg-[#0e4d3c]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                      activeTab === "admin" ? "bg-[#0a4738] text-[#3be8b0]" : "bg-[#3be8b0]/20 text-[#3be8b0]"
                    }`}>
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm">Super Admin</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Actions Footer: Logout & Save */}
            <div className="pt-2 border-t border-[#145a49] flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackupClick}
                disabled={isBackingUp}
                className="flex-1 py-2 px-3 rounded-lg bg-[#145a49] hover:bg-[#1b6b57] text-white border border-[#227a64] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CloudUpload className="w-3.5 h-3.5 text-[#3be8b0]" />
                <span>{isBackingUp ? "Saving..." : "Save Database"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="py-2 px-3.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-800/60 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

