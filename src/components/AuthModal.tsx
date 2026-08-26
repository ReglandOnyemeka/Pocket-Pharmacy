import React, { useState } from "react";
import {
  Lock,
  User,
  ShieldAlert,
  AlertCircle,
  X,
  CheckCircle2,
  Building2,
  LogIn
} from "lucide-react";
import { Pharmacy, AppUser } from "../types";
import { PocketPharmacyLogo } from "./PocketPharmacyLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacies: Pharmacy[];
  users: AppUser[];
  onLogin: (user: AppUser, pharmacy: Pharmacy) => void;
  onRegisterTenant: (params: {
    pharmacyName: string;
    directorName: string;
    location: string;
    phone: string;
    email: string;
    username: string;
    pin: string;
    cacNumber?: string;
    pcnLicense?: string;
  }) => void;
  showCancelButton?: boolean;
  isFullScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  pharmacies,
  users,
  onLogin,
  onRegisterTenant,
  showCancelButton = true,
  isFullScreen = false
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Tenant State (Becomes Super Admin)
  const [regPharmName, setRegPharmName] = useState("");
  const [regDirector, setRegDirector] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCac, setRegCac] = useState("");
  const [regPcn, setRegPcn] = useState("");
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUsername.toLowerCase().trim();
    const cleanPass = loginPassword.trim();

    // Check credentials (matches username and pin/password)
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser &&
        (u.pin === cleanPass || u.pin.toLowerCase() === cleanPass.toLowerCase())
    );

    if (!user) {
      setLoginError("Invalid username or password. Please verify your credentials.");
      return;
    }

    const matchingPharm = pharmacies.find((p) => p.id === user.pharmacyId) || pharmacies[0];
    onLogin(user, matchingPharm);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (
      !regPharmName.trim() ||
      !regDirector.trim() ||
      !regLocation.trim() ||
      !regPhone.trim() ||
      !regEmail.trim() ||
      !regUsername.trim() ||
      !regPassword.trim()
    ) {
      setRegError("Please fill in all mandatory fields.");
      return;
    }

    const cleanRegPass = regPassword.trim();
    if (cleanRegPass.length < 6 || cleanRegPass.length > 8) {
      setRegError("Super Admin password must be between 6 and 8 characters.");
      return;
    }

    // Check if username already taken globally
    if (users.some((u) => u.username.toLowerCase() === regUsername.toLowerCase().trim())) {
      setRegError("This username is already registered. Please choose another username.");
      return;
    }

    onRegisterTenant({
      pharmacyName: regPharmName.trim(),
      directorName: regDirector.trim(),
      location: regLocation.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      username: regUsername.trim(),
      pin: cleanRegPass,
      cacNumber: regCac.trim() || undefined,
      pcnLicense: regPcn.trim() || undefined
    });

    onClose();
  };

  const isLoginFormFilled = loginUsername.trim().length > 0 && loginPassword.trim().length > 0;

  const containerContent = (
    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col my-auto">
      {/* ================= ORIGINAL POCKET PHARMACY HERO HEADER ================= */}
      <div className="bg-[#0a4738] p-7 sm:p-8 text-center relative overflow-hidden shrink-0">
        {/* Subtle giant background watermark cross */}
        <div className="absolute -right-8 -bottom-12 opacity-20 pointer-events-none text-[#3be8b0]">
          <svg className="w-56 h-56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 3a2 2 0 0 1 4 0v6h6a2 2 0 1 1 0 4h-6v6a2 2 0 1 1-4 0v-6H4a2 2 0 1 1 0-4h6V3z" />
          </svg>
        </div>

        {showCancelButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-200/70 hover:text-white rounded-xl hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Original Iconic Logo Container */}
        <div className="mx-auto flex items-center justify-center">
          <PocketPharmacyLogo size="lg" showTenantSubtitle={true} />
        </div>
      </div>

      {/* ================= MODAL BODY ================= */}
      <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
        {/* Authentic Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-[#f1f5f9] p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              tab === "login"
                ? "bg-[#0a4738] text-white shadow-md shadow-emerald-950/20"
                : "text-slate-600 hover:text-[#0a4738] hover:bg-white/60"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Staff Login
          </button>

          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              tab === "register"
                ? "bg-[#0a4738] text-white shadow-md shadow-emerald-950/20"
                : "text-slate-600 hover:text-[#0a4738] hover:bg-white/60"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Onboard Pharmacy
          </button>
        </div>

        {/* ================= LOGIN FORM ================= */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-2">
                STAFF USERNAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. michael_superadmin or cashier_ade"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4738] focus:border-transparent transition-all"
                />
                <User className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-2">
                PASSWORD (6-8 CHARS)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter 6-8 character password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4738] focus:border-transparent transition-all"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-2 text-[11px] font-mono text-slate-500">
                Password is 6-8 characters assigned by Super Admin
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isLoginFormFilled}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isLoginFormFilled
                    ? "bg-[#0a4738] hover:bg-[#0d5947] text-white shadow-lg shadow-emerald-950/20 cursor-pointer"
                    : "bg-[#cbd5e1] text-white cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Sign In to Terminal
              </button>
            </div>
          </form>
        )}

        {/* ================= REGISTER / ONBOARD NEW TENANT PHARMACY ================= */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-2xl">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                Super Admin Pharmacy Onboarding
              </p>
              <p className="mt-0.5 text-emerald-800">
                Onboarding creates a dedicated workspace for your pharmacy. You will become the Super Admin and manage staff under your account.
              </p>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                PHARMACY / BUSINESS NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Health Pharmacy"
                value={regPharmName}
                onChange={(e) => setRegPharmName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  DIRECTOR / PHARMACIST *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharm. Mike Ade"
                  value={regDirector}
                  onChange={(e) => setRegDirector(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  PHYSICAL LOCATION *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ikeja, Lagos"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  OFFICIAL PHONE *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+234..."
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  OFFICIAL EMAIL *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@apexpharm.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 rounded-2xl space-y-3">
              <span className="block text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                SUPER ADMIN CREDENTIALS
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mike_superadmin"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Password (6-8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={8}
                    placeholder="e.g. Super12"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Must be 6 to 8 characters (letters, numbers, etc.)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#0a4738] hover:bg-[#0d5947] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Initialize Isolated Pharmacy Workspace
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-[#041f18] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#3be8b0] selection:text-[#041f18]">
        {/* Ambient background watermark */}
        <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none text-[#3be8b0]">
          <svg className="w-96 h-96" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 3a2 2 0 0 1 4 0v6h6a2 2 0 1 1 0 4h-6v6a2 2 0 1 1-4 0v-6H4a2 2 0 1 1 0-4h6V3z" />
          </svg>
        </div>
        {containerContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      {containerContent}
    </div>
  );
};
