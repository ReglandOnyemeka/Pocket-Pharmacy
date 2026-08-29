import React, { useState } from "react";
import {
  Lock,
  User,
  ShieldAlert,
  AlertCircle,
  X,
  CheckCircle2,
  Building2,
  LogIn,
  KeyRound,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import { Pharmacy, AppUser } from "../types";
import { PocketPharmacyLogo } from "./PocketPharmacyLogo";
import { resetSuperAdminPin } from "../utils/tenantStorage";

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
  onOpenLanding?: () => void;
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
  onOpenLanding,
  showCancelButton = true,
  isFullScreen = false
}) => {
  const [tab, setTab] = useState<"login" | "register" | "reset">("login");

  // Login State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Super Admin Password Reset State
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanId = resetIdentifier.trim();
    const cleanNewPass = resetNewPassword.trim();
    const cleanConfirm = resetConfirmPassword.trim();

    if (!cleanId) {
      setResetError("Please enter your Super Admin username or registered email.");
      return;
    }

    if (cleanNewPass.length < 6 || cleanNewPass.length > 8) {
      setResetError("New password must be between 6 and 8 characters long.");
      return;
    }

    if (cleanNewPass !== cleanConfirm) {
      setResetError("New password and confirmation do not match.");
      return;
    }

    setIsResetting(true);
    const res = resetSuperAdminPin(cleanId, cleanNewPass);
    setIsResetting(false);

    if (!res.success) {
      setResetError(res.message);
    } else {
      setResetSuccess(res.message);
      setLoginUsername(cleanId);
      setLoginPassword(cleanNewPass);
      setTimeout(() => {
        setTab("login");
        setResetSuccess(null);
        setResetIdentifier("");
        setResetNewPassword("");
        setResetConfirmPassword("");
      }, 2500);
    }
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
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl sm:rounded-3xl w-[90%] sm:w-full max-w-[420px] shadow-2xl border border-slate-200/90 overflow-hidden max-h-[82vh] sm:max-h-[88vh] flex flex-col my-auto transition-all"
    >
      {/* ================= COMPACT POCKET PHARMACY HEADER ================= */}
      <div className="bg-[#0a4738] py-3.5 px-4 sm:py-4.5 sm:px-6 text-center relative overflow-hidden shrink-0 border-b border-[#145a49]">
        {/* Subtle decorative background watermark cross */}
        <div className="absolute -right-6 -bottom-8 opacity-15 pointer-events-none text-[#3be8b0]">
          <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 3a2 2 0 0 1 4 0v6h6a2 2 0 1 1 0 4h-6v6a2 2 0 1 1-4 0v-6H4a2 2 0 1 1 0-4h6V3z" />
          </svg>
        </div>

        {showCancelButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 text-emerald-200/80 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Compact Centered Brand Logo */}
        <div className="mx-auto flex items-center justify-center">
          <PocketPharmacyLogo size="sm" showTenantSubtitle={false} />
        </div>
      </div>

      {/* ================= SCROLLABLE MODAL BODY ================= */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4">
        {/* Tab Switcher */}
        {tab !== "reset" ? (
          <div className="grid grid-cols-2 gap-1.5 bg-[#f1f5f9] p-1 rounded-xl sm:rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-[#0a4738] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0a4738] hover:bg-white/60"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("register")}
              className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === "register"
                  ? "bg-[#0a4738] text-white shadow-sm"
                  : "text-slate-600 hover:text-[#0a4738] hover:bg-white/60"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Onboard</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setResetError(null);
                setResetSuccess(null);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Super Admin Portal
            </span>
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-3.5">
            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                USERNAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. michael_superadmin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 sm:py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4738] focus:border-transparent transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider">
                  PASSWORD (6-8 CHARS)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab("reset");
                    setResetError(null);
                    setResetSuccess(null);
                    if (loginUsername) setResetIdentifier(loginUsername);
                  }}
                  className="text-[10px] sm:text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-emerald-600" />
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter 6-8 char password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 sm:py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4738] focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={!isLoginFormFilled}
                className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  isLoginFormFilled
                    ? "bg-[#0a4738] hover:bg-[#0d5947] text-white shadow-md cursor-pointer"
                    : "bg-[#cbd5e1] text-white cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign In to Terminal</span>
              </button>
            </div>

            {/* Quick 1-Click Demo Fill for Fast Testing */}
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                ✨ Instant Demo Access (1-Click Fill)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername("michael_superadmin");
                    setLoginPassword("Super12");
                    setLoginError(null);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-emerald-950 flex items-center gap-1">
                    👑 Admin
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-700 font-mono truncate">
                    michael_superadmin
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const pharmUser = users.find(u => u.role === "admin" && u.username !== "michael_superadmin") || users[1];
                    if (pharmUser) {
                      setLoginUsername(pharmUser.username);
                      setLoginPassword(pharmUser.pin);
                    } else {
                      setLoginUsername("pharm_chioma");
                      setLoginPassword("Chioma1");
                    }
                    setLoginError(null);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-blue-950 flex items-center gap-1">
                    👩🏾‍⚕️ Pharm
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-blue-700 font-mono truncate">
                    pharm_chioma
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cashierUser = users.find(u => u.role === "cashier") || users[2];
                    if (cashierUser) {
                      setLoginUsername(cashierUser.username);
                      setLoginPassword(cashierUser.pin);
                    } else {
                      setLoginUsername("cashier_ade");
                      setLoginPassword("Adeola1");
                    }
                    setLoginError(null);
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1">
                    👨🏾‍💼 Cashier
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-amber-700 font-mono truncate">
                    cashier_ade
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================= SUPER ADMIN PASSWORD RESET ================= */}
        {tab === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-3">
            <div className="p-3 bg-amber-50/90 border border-amber-200 text-[11px] rounded-xl text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Super Admin Account Password Reset
              </p>
              <p className="text-amber-800 text-[10.5px] leading-relaxed">
                Designated for <strong>Super Admin</strong> director accounts. Staff credentials must be managed inside the Staff Dashboard.
              </p>
            </div>

            {resetError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-950">{resetSuccess}</p>
                  <p className="text-[10px] text-emerald-800 mt-0.5">Redirecting to Sign In...</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                SUPER ADMIN USERNAME OR EMAIL *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. michael_superadmin"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                NEW PASSWORD (6-8 CHARS) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={8}
                  placeholder="Enter new 6-8 char password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                CONFIRM NEW PASSWORD *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={8}
                  placeholder="Re-enter new password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("login")}
                className="w-1/3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting || !resetIdentifier.trim() || !resetNewPassword.trim()}
                className="w-2/3 py-2 rounded-xl bg-[#0a4738] hover:bg-[#0d5947] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isResetting ? "Updating..." : "Reset Password"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= REGISTER / ONBOARD NEW TENANT PHARMACY ================= */}
        {tab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 rounded-xl">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
                Super Admin Pharmacy Onboarding
              </p>
              <p className="mt-0.5 text-emerald-800 text-[11px]">
                Creates an isolated workspace for your location. You will become Super Admin.
              </p>
            </div>

            {regError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                PHARMACY NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Health Pharmacy"
                value={regPharmName}
                onChange={(e) => setRegPharmName(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  DIRECTOR *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pharm. Mike"
                  value={regDirector}
                  onChange={(e) => setRegDirector(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  LOCATION *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ikeja, Lagos"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  PHONE *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+234..."
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 uppercase tracking-wider mb-1">
                  EMAIL *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@pharm.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-100 rounded-xl space-y-2">
              <span className="block text-[10px] font-bold font-mono text-slate-800 uppercase tracking-wider">
                SUPER ADMIN CREDENTIALS
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mike_superadmin"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Password (6-8) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={8}
                    placeholder="Super12"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a4738]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0a4738] hover:bg-[#0d5947] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Initialize Workspace</span>
            </button>
          </form>
        )}

        {/* Overview & Subscription Link */}
        {onOpenLanding && (
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenLanding}
              className="text-[11px] sm:text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
            >
              Pocket Pharmacy Website
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-[#041f18] flex items-center justify-center p-3 sm:p-5 relative overflow-hidden selection:bg-[#3be8b0] selection:text-[#041f18]">
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
    <div
      onClick={() => {
        if (showCancelButton) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs sm:backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {containerContent}
    </div>
  );
};
