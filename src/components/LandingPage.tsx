import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
  Store,
  Hospital,
  Package,
  Layers,
  Sparkles,
  Users,
  MessageCircle,
  Stethoscope,
  Smile,
  Heart,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle
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
  // Navigation drawer toggle for mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Pricing billing period toggle (monthly vs annual)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Pharmacy setup category toggle filter
  const [activeCategory, setActiveCategory] = useState<"all" | "community" | "hospital" | "wholesale" | "chain">("all");

  // FAQ accordion toggles
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Calculator slider & preset toggle
  const [dailyPatients, setDailyPatients] = useState<number>(35);

  // Human care metrics calculation
  const hoursSavedPerWeek = Math.round((dailyPatients * 4.2 * 6) / 60);
  const potentialLossPrevented = Math.round(dailyPatients * 850 * 30);
  const patientCareScore = Math.min(99, 85 + Math.round(dailyPatients / 10));

  const pharmacyCategories = [
    {
      id: "community",
      type: "community" as const,
      icon: Store,
      title: "Community Pharmacies",
      iconBg: "bg-emerald-100 text-[#0a4738]",
      borderHover: "hover:border-emerald-300",
      description: "Streamline daily OTC retail sales, print thermal receipts, and send digital WhatsApp receipts directly to patients.",
      features: ["Rapid barcode lookup", "Split tender (Cash + POS transfer)", "Thermal & WhatsApp receipts"]
    },
    {
      id: "hospital",
      type: "hospital" as const,
      icon: Hospital,
      title: "Hospital Dispensaries",
      iconBg: "bg-blue-100 text-blue-800",
      borderHover: "hover:border-blue-300",
      description: "Maintain accurate ward medication inventories, verify drug molecules, and hand over cashier shifts with zero discrepancies.",
      features: ["Ward stock tracking", "Molecule & formulation checks", "Shift reconciliation logs"]
    },
    {
      id: "wholesale",
      type: "wholesale" as const,
      icon: Package,
      title: "Wholesale & Distributors",
      iconBg: "bg-amber-100 text-amber-800",
      borderHover: "hover:border-amber-300",
      description: "Track carton and bulk packaging, manage fast Excel/CSV imports, and reorder stock directly from major distributors.",
      features: ["Carton & unit conversions", "Excel bulk price updates", "1-Click supplier WhatsApp reorder"]
    },
    {
      id: "chain",
      type: "chain" as const,
      icon: Layers,
      title: "Pharmacy Chains",
      iconBg: "bg-purple-100 text-purple-800",
      borderHover: "hover:border-purple-300",
      description: "Branch isolation with Super Admin visibility over all locations, sales figures, and inventory health from any phone or PC.",
      features: ["Centralized owner analytics", "Role-based cashier permissions", "Cloud database synchronization"]
    }
  ];

  const faqs = [
    {
      q: "Does Pocket Pharmacy work on smartphones, tablets, and desktop computers?",
      a: "Yes. Pocket Pharmacy is fully responsive and optimized for touchscreens, mobile phones, iPads/tablets, laptops, and POS desktop terminals with barcode scanners."
    },
    {
      q: "How does the digital WhatsApp receipt feature work?",
      a: "With one tap after checkout, Pocket Pharmacy formats a clean, compassionate digital receipt with dosage instructions and medication details that opens directly in WhatsApp for your patient or caregiver."
    },
    {
      q: "Can I import my existing drug inventory from Microsoft Excel or CSV?",
      a: "Yes. You can import thousands of medications in seconds using our standard Excel/CSV template, complete with unit prices, expiry dates, batch numbers, and stock quantities."
    },
    {
      q: "Can I assign different roles and pins for cashiers, pharmacists, and managers?",
      a: "Yes. Pocket Pharmacy provides granular role-based access control. Cashiers can dispense and print receipts, while admin accounts hold permission to edit wholesale costs, delete items, or access financial audit summaries."
    },
    {
      q: "Does it support 58mm and 80mm ESC/POS thermal receipt printers?",
      a: "Yes. The workspace provides clean, standard thermal receipt print formatting that connects seamlessly to standard USB, Bluetooth, or network receipt printers."
    }
  ];

  const filteredCategories = activeCategory === "all" 
    ? pharmacyCategories 
    : pharmacyCategories.filter(c => c.type === activeCategory);

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-slate-800 flex flex-col font-sans selection:bg-[#3be8b0] selection:text-[#063327]">
      
      {/* ================= TOP ANNOUNCEMENT BANNER ================= */}
      <div className="bg-[#052e24] text-emerald-100 text-xs py-2.5 px-3 sm:px-4 border-b border-[#0a4738]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between flex-wrap gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3be8b0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3be8b0]"></span>
            </span>
            <span className="font-medium text-emerald-200">
              Trusted by Nigerian Pharmacists & Healthcare Dispensers
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-emerald-300/80">
            <span className="hidden sm:inline">🌿 Built with clinical care & empathy</span>
            <a
              href="https://wa.me/2348060429226?text=Hello%20Pocket%20Pharmacy,%20I%20would%20like%20to%20learn%20more%20about%20the%20workspace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3be8b0] hover:underline font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ================= STICKY HEADER WITH MOBILE TOGGLE ================= */}
      <header className="bg-[#0a4738] text-white sticky top-0 z-50 border-b border-[#145a49]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <PocketPharmacyLogo size="md" variant="dark" showTenantSubtitle={false} />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-emerald-100/90">
              <a href="#story" className="hover:text-white transition-colors">Our Purpose</a>
              <a href="#about" className="hover:text-white transition-colors">Pharmacy Types</a>
              <a href="#calculator" className="hover:text-white transition-colors">Care Calculator</a>
              <a href="#voices" className="hover:text-white transition-colors">Voices</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
            </nav>

            {/* Top Action & Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onLogin || onGetStarted}
                className="hidden sm:inline-flex px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-emerald-100 hover:text-white hover:bg-[#145a49] transition-all cursor-pointer"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onGetStarted}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <span>Launch Free Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Mobile menu toggle button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
                className="lg:hidden p-2 rounded-lg bg-[#145a49] text-emerald-100 hover:text-white hover:bg-[#1c6e59] transition-colors border border-[#227a64] flex items-center justify-center cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#07362b] border-t border-[#145a49] px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-emerald-100">
              <a
                href="#story"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Our Purpose
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Pharmacy Types
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Care Calculator
              </a>
              <a
                href="#voices"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Pharmacist Voices
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Pricing & Plans
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors"
              >
                Frequently Asked Questions
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0a4738] transition-colors text-emerald-300"
              >
                Contact & Support
              </a>
            </nav>

            <div className="pt-3 border-t border-emerald-800/60 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-2.5 rounded-lg text-center font-bold bg-[#3be8b0] text-[#0a4738] text-sm shadow-sm"
              >
                Launch Free Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogin) onLogin();
                  else onGetStarted();
                }}
                className="w-full py-2 rounded-lg text-center font-semibold bg-[#145a49] text-emerald-100 hover:text-white text-xs border border-[#227a64]"
              >
                Sign In to Account
              </button>
              <a
                href="https://wa.me/2348060429226?text=Hello%20Pocket%20Pharmacy,%20I%20need%20assistance"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-lg text-center font-medium bg-[#145a49] text-white text-xs border border-[#227a64] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#3be8b0]" />
                WhatsApp: 08060429226
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="bg-[#0a4738] text-white pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#145a49]">
        <div className="max-w-5xl mx-auto text-left sm:text-center space-y-5 sm:space-y-6">
          
          {/* Human empathy pill */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-md bg-emerald-900/80 border border-emerald-500/30 text-xs font-medium text-emerald-200">
            <Heart className="w-3.5 h-3.5 text-[#3be8b0] fill-[#3be8b0] shrink-0" />
            <span className="text-[11px] sm:text-xs">Built with compassion for the people safeguarding Nigerian health</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Pharmacy Workspace That Feels <br className="hidden sm:block" />
            <span className="text-[#3be8b0]">
              Human, Calm, & Reliable
            </span>
          </h1>

          <p className="max-w-3xl sm:mx-auto text-sm sm:text-base md:text-lg text-emerald-100/90 leading-relaxed font-normal">
            Pharmacists are the most accessible healthcare providers in our communities. Pocket Pharmacy takes away the stress of manual ledgers, stockouts, and noisy calculations so you can give your patients the caring attention they deserve.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] text-sm sm:text-base font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <Smile className="w-5 h-5 shrink-0" />
              <span>Try Pocket Pharmacy Free</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <a
              href="https://wa.me/2348060429226?text=Hello%20Pocket%20Pharmacy,%20I%20would%20love%20a%20personal%20walkthrough%20for%20my%20pharmacy"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-[#145a49] hover:bg-[#1c6e59] text-white text-sm sm:text-base font-bold transition-all border border-[#227a64] flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <MessageCircle className="w-5 h-5 text-[#3be8b0] shrink-0" />
              <span>Book Friendly WhatsApp Tour</span>
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 sm:pt-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#145a49] border border-[#145a49] rounded-xl overflow-hidden text-left">
            <div className="p-4 bg-[#0a4738]">
              <div className="text-xl sm:text-2xl font-bold text-amber-300">&lt; 15 sec</div>
              <div className="text-xs text-emerald-200 mt-0.5">Average Patient Checkout</div>
            </div>
            <div className="p-4 bg-[#0a4738]">
              <div className="text-xl sm:text-2xl font-bold text-[#3be8b0]">99.8%</div>
              <div className="text-xs text-emerald-200 mt-0.5">Stock Reconcile Accuracy</div>
            </div>
            <div className="p-4 bg-[#0a4738]">
              <div className="text-xl sm:text-2xl font-bold text-emerald-100">0 Lock-in</div>
              <div className="text-xs text-emerald-200 mt-0.5">Export & Backup Anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THE HUMAN STORY / OUR PURPOSE ================= */}
      <section id="story" className="py-12 sm:py-16 bg-[#f4f9f6] border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-[#0a4738] text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" />
                Why We Built Pocket Pharmacy
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
                "When pharmacists have peace of mind, patients receive better healthcare."
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Running a pharmacy in Nigeria comes with real hurdles: fluctuating drug wholesale prices, erratic power, tedious stock audits after long standing hours, and the pressure of keeping patient records safe.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                We designed Pocket Pharmacy with a warm, intuitive layout that eliminates software frustration. No complex training required. If your team can use a smartphone, they can run their entire pharmacy shift with confidence.
              </p>

              <div className="pt-2 space-y-2.5">
                <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Works smoothly even when network is unstable</span>
                </div>
                <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Direct WhatsApp receipts for patients & caregivers</span>
                </div>
                <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Clinical drug molecule & dosage guidance right at checkout</span>
                </div>
              </div>
            </div>

            {/* Visual Card / Empathy Highlight */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl p-5 sm:p-8 border border-emerald-200/80 shadow-sm space-y-4 sm:space-y-5">
                <blockquote className="text-slate-700 italic text-xs sm:text-sm leading-relaxed">
                  "Before Pocket Pharmacy, closing at 9 PM meant another hour of tallying paper receipts and arguing over missing cartons. Now my staff finish balancing in under 3 minutes. I sleep better knowing our records are clean and my patients are properly guided."
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px] sm:text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Community Pharmacist
                  </span>
                  <span className="text-[11px] sm:text-xs">Member, PSN Lagos Branch</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE CARE & PEACE OF MIND CALCULATOR WITH PRESET TOGGLE ================= */}
      <section id="calculator" className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Interactive Impact Calculator
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              See the Hours & Stress You Save Every Month
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select a quick preset or adjust the slider to match your daily footfall:
            </p>

            {/* Quick Preset Toggle Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDailyPatients(20)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyPatients === 20 
                    ? "bg-[#0a4738] text-white shadow-sm" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Neighborhood Chemist (20/day)
              </button>
              <button
                type="button"
                onClick={() => setDailyPatients(50)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyPatients === 50 
                    ? "bg-[#0a4738] text-white shadow-sm" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Busy Retail (50/day)
              </button>
              <button
                type="button"
                onClick={() => setDailyPatients(120)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dailyPatients === 120 
                    ? "bg-[#0a4738] text-white shadow-sm" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Hospital / High Volume (120+/day)
              </button>
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="text-xs sm:text-sm font-bold text-slate-800">
                  Average Patients Dispensed Daily:
                </label>
                <span className="text-sm sm:text-base font-bold text-[#0a4738] bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                  {dailyPatients} patients / day
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={dailyPatients}
                onChange={(e) => setDailyPatients(Number(e.target.value))}
                className="w-full accent-[#0a4738] cursor-pointer h-2.5 bg-slate-200 rounded"
              />
              <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
                <span>10/day (Chemist)</span>
                <span>250+/day (Hospital Dispensary)</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-200">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0a4738]">
                  ~{hoursSavedPerWeek} hrs
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Saved Each Week</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Less manual recording & faster checkout</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-600">
                  ₦{potentialLossPrevented.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Monthly Loss Prevented</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Via early expiry alerts & stock audit logs</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-600">
                  {patientCareScore}%
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-1">Peace of Mind Score</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Reconciled shifts & happy patients</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHARMACY CATEGORIES WITH INTERACTIVE FILTER TOGGLES ================= */}
      <section id="about" className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Designed For Every Pharmacy Setup
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              Tailored for how healthcare professionals really work
            </p>

            {/* Category Toggle Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                All Dispensaries
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("community")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === "community"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🏪 Community Retail
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("hospital")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === "hospital"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🏥 Hospital Dispensary
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("wholesale")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === "wholesale"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                📦 Wholesale
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory("chain")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === "chain"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                🏢 Multi-branch Chain
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredCategories.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-5 sm:p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 ${item.borderHover} transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5">
                    {item.features.map((feat, i) => (
                      <div key={i} className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PHARMACIST VOICES / TESTIMONIALS ================= */}
      <section id="voices" className="py-12 sm:py-16 bg-[#f4f9f6] border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-[#0a4738] text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              Voices From The Field
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              Loved by Healthcare Teams Across Nigeria
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col justify-between space-y-4">
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                "The Intelligent clinical consult is an absolute lifesaver when a brand is out of stock in Lagos. I can instantly see what equivalent molecule we have on our shelf and counsel the patient with certainty."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-[#0a4738] flex items-center justify-center font-bold text-sm">
                  👨🏾‍⚕️
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Dr. Ifeanyi Okafor</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">St. Luke Dispensary, Garki Abuja</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col justify-between space-y-4">
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                "Our cashiers learned how to use the POS in 10 minutes. The split payment for POS transfer and cash makes handling messy bank network delays completely painless."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  👩🏾‍💼
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Pharm. Amaka Nwosu</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">CarePlus Pharmacy, Port Harcourt</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col justify-between space-y-4">
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                "Automated stock audit reminders helped us spot discrepancies before they accumulated into major losses. Best ₦5,000 we spend on our store operations every month."
              </p>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                  👨🏾‍⚕️
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Pharm. Tunde Alabi</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Alabi Chemists, Ibadan</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= PRICING & SUBSCRIPTION SECTION WITH BILLING TOGGLE ================= */}
      <section id="pricing" className="py-12 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Transparent, Fair & Honest
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              One Flat Plan. Zero Hidden Fees.
            </p>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm">
              We never take a percentage of your drug sales. Full access for all your staff.
            </p>

            {/* Monthly vs Annual Toggle */}
            <div className="mt-6 inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly Plan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === "annual"
                    ? "bg-[#0a4738] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Annual Plan</span>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="max-w-lg mx-auto bg-[#0a4738] text-white rounded-2xl p-6 sm:p-10 border border-[#145a49] shadow-sm relative">
            <div className="absolute top-0 right-6 sm:right-8 -translate-y-1/2 bg-[#3be8b0] text-[#0a4738] text-[10px] sm:text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Full Workspace Access
            </div>

            <div className="text-center pb-6 border-b border-emerald-800/80">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Pocket Pharmacy Workspace</h3>
              <p className="text-emerald-200 text-xs sm:text-sm mt-1">Complete software license for your pharmacy location</p>
              
              <div className="mt-5 sm:mt-6 flex items-baseline justify-center gap-1">
                <span className="text-3xl sm:text-5xl font-black text-[#3be8b0]">
                  {billingCycle === "monthly" ? "₦5,000" : "₦50,000"}
                </span>
                <span className="text-emerald-200 text-xs sm:text-sm font-medium">
                  {billingCycle === "monthly" ? "/ month" : "/ year (2 months free)"}
                </span>
              </div>
            </div>

            <div className="py-6 space-y-3 text-xs sm:text-sm text-emerald-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Unlimited Sales, Barcode Scanning & POS Receipts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Inventory & Batch Expiry Tracking with WhatsApp Reorder</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Intelligent Clinical Pharmacology & Lagos Market Benchmarks</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Automated Stock Audits & Discrepancy Reconciliation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Unlimited Cashier, Pharmacist & Admin User Accounts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#3be8b0] shrink-0" />
                <span>Direct WhatsApp Onboarding Support by Real Humans</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGetStarted}
              className="w-full mt-2 py-3.5 sm:py-4 rounded-xl bg-[#3be8b0] hover:bg-[#32ce9c] text-[#0a4738] text-sm sm:text-base font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] sm:text-[11px] text-center text-emerald-300/80 mt-2.5">
              No credit card required. Setup takes under 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FREQUENTLY ASKED QUESTIONS (COLLAPSIBLE TOGGLE ACCORDION) ================= */}
      <section id="faqs" className="py-12 sm:py-16 bg-[#f8fafc] border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-[#0a4738] text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">
              Clear Answers for Pharmacy Owners
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="p-1 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HUMAN CONTACT & WHATSAPP SUPPORT ================= */}
      <section id="contact" className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">
              Friendly Human Support
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              We Are Here Whenever You Need Us
            </p>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm">
              Speak directly with our pharmacy solutions team in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Phone & WhatsApp Card */}
            <a
              href="https://wa.me/2348060429226?text=Hello%20Pocket%20Pharmacy%20Team,%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 sm:p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-emerald-500 shadow-sm transition-all flex items-start gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp & Phone</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Online
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">08060429226</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Tap to chat directly with our team</p>
              </div>
            </a>

            {/* Email Card */}
            <a
              href="mailto:info@gwisebrands"
              className="p-5 sm:p-6 rounded-2xl bg-[#f8fafc] border border-slate-200 hover:border-emerald-500 shadow-sm transition-all flex items-start gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Email</h3>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">info@gwisebrands</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Send questions or proposals</p>
              </div>
            </a>
          </div>

          {/* Bottom Brand Statement */}
          <div className="mt-8 sm:mt-12 text-center p-5 sm:p-6 bg-emerald-50/80 rounded-xl border border-emerald-200 max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm font-bold text-emerald-950">
              Pocket Pharmacy is a brand of <span className="text-emerald-700">Pawsome Connect</span>
            </p>
            <p className="text-[11px] sm:text-xs text-emerald-800 mt-1">
              Serving community pharmacists, hospital dispensers, and healthcare teams across Nigeria with pride.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#052e24] text-emerald-100 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-t border-[#0a4738] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-xs text-center sm:text-left">
          <div className="flex items-center gap-3">
            <PocketPharmacyLogo size="sm" variant="dark" showTenantSubtitle={false} />
            <span className="text-emerald-300">
              • A Brand of <strong className="text-white">Pawsome Connect</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <a href="tel:08060429226" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#3be8b0]" /> 08060429226
            </a>
            <a href="mailto:info@gwisebrands" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#3be8b0]" /> info@gwisebrands
            </a>
          </div>

          <div className="text-emerald-400/80">
            © {new Date().getFullYear()} Pocket Pharmacy. Handcrafted for healthcare champions.
          </div>
        </div>
      </footer>
    </div>
  );
};
