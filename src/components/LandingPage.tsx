import React from "react";
import {
  ShoppingBag,
  Package,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
  Building,
  Store,
  Hospital,
  Boxes,
  Clock,
  Database,
  FileText
} from "lucide-react";
import { PocketPharmacyLogo } from "./PocketPharmacyLogo";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onViewWorkspace?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="bg-[#0a4738] text-white sticky top-0 z-50 border-b border-[#145a49] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <PocketPharmacyLogo size="md" variant="dark" showTenantSubtitle={false} />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-emerald-100/90">
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
              <a href="#pricing" className="hover:text-white transition-colors">Subscription</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onLogin}
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#145a49] hover:bg-[#1c6e59] text-white transition-all border border-[#227a64]"
              >
                Staff Login
              </button>
              <button
                type="button"
                onClick={onGetStarted}
                className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] transition-all shadow-md shadow-emerald-950/20 flex items-center gap-1.5"
              >
                <span>Try Today</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="bg-gradient-to-b from-[#0a4738] to-[#0d5543] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#3be8b0]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Operating Workspace for <br className="hidden sm:block" />
            <span className="text-[#3be8b0]">All Categories of Pharmacies</span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-emerald-100/90 leading-relaxed">
            Pocket Pharmacy empowers community pharmacies and hospital dispensaries with fast POS sales, inventory management, market intelligence, and multi-staff management.
          </p>

          {/* Call To Action Button */}
          <div className="pt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] text-base font-extrabold shadow-xl shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Try Pocket Pharmacy Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= SUPPORTED PHARMACY CATEGORIES ================= */}
      <section id="about" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Designed For Every Pharmacy Setup
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Built to serve all categories of pharmacy operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Community Pharmacies</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Streamline daily OTC retail sales, print branded thermal receipts, and alert patients on dosage schedules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Hospital className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hospital Dispensaries</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Maintain accurate ward medication inventories, verify contraindications, and manage shift cashiers securely.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Wholesale & Distributors</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track carton and bulk packaging, manage fast bulk imports via Excel/CSV, and reconcile batch shipments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Pharmacy Chains</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide branch isolation while giving Super Admins complete visibility over revenue, stock audits, and staff roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE BENEFITS SECTION ================= */}
      <section id="benefits" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5" />
              Core Benefits & Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything Your Pharmacy Needs to Thrive
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Engineered specifically for Nigerian pharmacy workflows to eliminate stock loss and accelerate checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">High-Speed POS Checkout</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scan barcodes or search drugs instantly. Supports Cash, POS Transfer, and Card payments with automatic receipt generation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Inventory & Batch Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track batch numbers, manufacturing dates, and near-expiry drugs before they expire, minimizing product loss.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Stock Audit Schedules</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Configure Daily, Weekly, or Monthly stock audit reminders. Log physical counts and reconcile discrepancies automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Super Admin & Staff Governance</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create role-restricted accounts for Cashiers, Pharmacists, and Admins.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pharmacy Intelligence</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instant clinical guidance on dosage, drug interactions, contraindications, and side effects directly inside the workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING & SUBSCRIPTION SECTION ================= */}
      <section id="pricing" className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Simple & Affordable Subscription
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              One Flat Price for Full Access
            </p>
            <p className="mt-3 text-slate-600">
              No hidden fees, no per-transaction commissions. Unlimited products, sales, and staff logins.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-gradient-to-b from-[#0a4738] to-[#07362b] text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#145a49] relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#3be8b0] text-[#0a4738] text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              Full Workspace Access
            </div>

            <div className="text-center pb-6 border-b border-emerald-800/80">
              <h3 className="text-2xl font-bold text-white">Pocket Pharmacy License</h3>
              <p className="text-emerald-200 text-sm mt-1">Complete operating workspace for your pharmacy</p>
              
              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black text-[#3be8b0]">₦5,000</span>
                <span className="text-emerald-200 text-sm font-medium">/ subscription</span>
              </div>
            </div>

            <div className="py-6 space-y-3.5 text-sm text-emerald-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3be8b0] shrink-0" />
                <span>Unlimited Point of Sale & Receipt Printing</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3be8b0] shrink-0" />
                <span>Inventory & Batch Expiry Tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3be8b0] shrink-0" />
                <span>Automated Stock Audit Discrepancy Reconciliation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3be8b0] shrink-0" />
                <span>Unlimited Staff & Role Management (Super Admin)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3be8b0] shrink-0" />
                <span>Dedicated Customer & Technical Support</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGetStarted}
              className="w-full mt-2 py-4 rounded-2xl bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] text-base font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>Try Pocket Pharmacy Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= CONTACT DETAILS & SUPPORT ================= */}
      <section id="contact" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Get In Touch & Support
            </h2>
            <p className="text-3xl font-extrabold text-slate-900">
              We're Here to Help Your Pharmacy
            </p>
            <p className="mt-2 text-slate-600 text-sm">
              Questions about onboarding, subscriptions, or setup? Reach out directly to our team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Phone Card */}
            <a
              href="tel:08060429226"
              className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone / WhatsApp</h3>
                <p className="text-lg font-extrabold text-slate-900 mt-1">08060429226</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Call or message for instant assistance</p>
              </div>
            </a>

            {/* Email Card */}
            <a
              href="mailto:info@gwisebrands"
              className="p-7 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Email</h3>
                <p className="text-lg font-extrabold text-slate-900 mt-1">info@gwisebrands</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Send inquiries & licensing requests</p>
              </div>
            </a>
          </div>

          {/* Bottom Brand Statement */}
          <div className="mt-12 text-center p-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 max-w-3xl mx-auto">
            <p className="text-sm font-bold text-emerald-950">
              Pocket Pharmacy is a brand of <span className="text-emerald-700">Pawsome Connect</span>
            </p>
            <p className="text-xs text-emerald-800 mt-1">
              Providing reliable digital operating workspace software for community, hospital, and wholesale pharmacies.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#062820] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8 border-t border-[#0a4738] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <PocketPharmacyLogo size="sm" variant="dark" showTenantSubtitle={false} />
            <span className="text-emerald-300">
              • A Brand of <strong className="text-white">Pawsome Connect</strong>
            </span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="tel:08060429226" className="hover:text-white transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#3be8b0]" /> 08060429226
            </a>
            <a href="mailto:info@gwisebrands" className="hover:text-white transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#3be8b0]" /> info@gwisebrands
            </a>
          </div>

          <div className="text-emerald-400/80">
            © {new Date().getFullYear()} Pocket Pharmacy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
