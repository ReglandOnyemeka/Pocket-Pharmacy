import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  ArrowLeft,
  ArrowRight,
  Percent,
  Award,
  ShieldAlert,
  Layers,
  Activity,
  Database,
  Smartphone,
  X,
  Play,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Printer
} from "lucide-react";

interface PitchDeckProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PitchDeck({ isOpen, onClose }: PitchDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Financial Forecaster state
  const [subscribedPharmacies, setSubscribedPharmacies] = useState(3000); // Default simulated units
  const [avgMonthlyVolume, setAvgMonthlyVolume] = useState(4000000); // ₦4M default
  const [monthlySaasFee, setMonthlySaasFee] = useState(5000); // ₦5k base default for everyone

  // Calculate financials live
  const financialMetrics = useMemo(() => {
    const annualSaas = subscribedPharmacies * monthlySaasFee * 12;
    const annualTxFees = subscribedPharmacies * avgMonthlyVolume * 12 * 0.005; // 0.5% take rate on split B2B transaction flows
    const totalARR = annualSaas + annualTxFees;
    const grossProfit = totalARR * 0.88; // 88% gross margin (typical SaaS/B2B transaction platform)
    
    return {
      annualSaas,
      annualTxFees,
      totalARR,
      grossProfit
    };
  }, [subscribedPharmacies, avgMonthlyVolume, monthlySaasFee]);

  const handlePrintPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to export the pitch deck as a PDF.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Pocket Pharmacy - B2B Investor Presentation 2026</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .slide-page {
        page-break-after: always;
        break-after: page;
        height: 100vh;
        max-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-sizing: border-box;
        overflow: hidden;
      }
      .no-print {
        display: none !important;
      }
    }
    .slide-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 3.5rem;
    }
  </style>
</head>
<body class="bg-slate-100 font-sans text-slate-900 antialiased selection:bg-emerald-100">

  <!-- Print Instruction Bar -->
  <div class="no-print bg-gradient-to-r from-emerald-600 to-indigo-900 text-white px-6 py-4 font-medium text-xs flex justify-between items-center shadow-lg border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="bg-white text-emerald-950 font-black px-2 py-0.5 rounded text-sm">📄</div>
      <div>
        <span class="font-bold block text-sm">Pocket Pharmacy Pitch Deck PDF Exporter</span>
        <span class="text-slate-300">Set paper orientation to <span class="font-bold text-emerald-300">Landscape</span>, enable <span class="font-bold text-emerald-300">Background graphics</span>, and Save as PDF.</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="window.print()" class="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 border border-emerald-400">
        <span>Click to Print / Save PDF</span>
      </button>
    </div>
  </div>

  <!-- Slide 1: Title Cover -->
  <div class="slide-page bg-gradient-to-br from-slate-950 via-[#0a4a3a] to-indigo-950 text-white relative overflow-hidden">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <span class="bg-white text-[#0a4a3a] font-black text-base px-2 py-0.5 rounded">+</span>
        <span class="font-mono text-xs font-bold tracking-wider text-emerald-300">POCKET PHARMACY B2B</span>
      </div>
      <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
        INVESTOR DECK 2026
      </span>
    </div>
    
    <div class="my-auto space-y-6 max-w-3xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
        Re-Engineering Pharmaceutical Logistics in Emerging Markets
      </div>
      <h1 class="text-5xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-cyan-100">
        Pocket Pharmacy
      </h1>
      <p class="text-xl font-light text-slate-200 leading-relaxed max-w-2xl">
        An integrated <span class="font-semibold text-emerald-400">Clinical POS, Real-Time Inventory, & AI Decision Suite</span> for pharmacies and clinical wholesalers.
      </p>
    </div>

    <div class="flex justify-between items-center border-t border-white/10 pt-6 text-slate-400 text-xs font-mono">
      <div>
        <p class="font-bold text-slate-300">Market Focus: Lagos, Nigeria</p>
        <p class="text-slate-500">Sub-Saharan Africa Wholesale & Retail Expansion</p>
      </div>
      <p>Slide 1 of 9</p>
    </div>
  </div>

  <!-- Slide 2: The Core Problems -->
  <div class="slide-page bg-slate-50 text-slate-800">
    <div>
      <span class="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">B2B INEFFICIENCY</span>
      <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-3">
        The Trillion-Naira Pharmacy Leakage
      </h2>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Pharmacies looking to optimize their inventories and clinical distributors across Africa run on fragmented tools, resulting in catastrophic business and clinical leakages.
      </p>

      <div class="grid grid-cols-2 gap-6 mt-8">
        <div class="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
          <h4 class="font-bold text-slate-950 text-sm">1. Catastrophic Medicine Expirations</h4>
          <p class="text-xs text-slate-600 leading-relaxed">₦340B+ lost in waste annually in West Africa. Shelf-life tracking is manual or completely ignored until drugs have expired and must be destroyed.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-red-200 shadow-sm space-y-2">
          <h4 class="font-bold text-slate-950 text-sm">2. Destructive Stockouts & Overstocks</h4>
          <p class="text-xs text-slate-600 leading-relaxed">Critical medicines (such as insulin, oncology pills) are often out-of-stock. Stocktaking audits are infrequent, leading to severe inventory mismatches.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
          <h4 class="font-bold text-slate-950 text-sm">3. Rigid B2B Wholesale Payment Bottlenecks</h4>
          <p class="text-xs text-slate-600 leading-relaxed">Cash, direct card swiping, and slow bank transfers cause friction. Over 70% of transactions require complex combinations of payment methods on single orders.</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-2">
          <h4 class="font-bold text-slate-950 text-sm">4. Pharmacovigilance & Decision Deficits</h4>
          <p class="text-xs text-slate-600 leading-relaxed">Cashiers lack instant access to clinical knowledge: verifying prescription-only medicine (POM) guidelines or matching generic bio-equivalents on-the-spot.</p>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-[#0a4a3a]">Validated by Lagos Clinical Practice Audits</p>
      <p>Slide 2 of 9</p>
    </div>
  </div>

  <!-- Slide 3: Our Solution -->
  <div class="slide-page bg-[#0a4a3a] text-white">
    <div>
      <span class="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">THE REVOLUTION</span>
      <h2 class="text-3xl font-bold text-white tracking-tight mt-3">
        One Unified, Intelligent Clinical POS Suite
      </h2>
      <p class="text-sm text-emerald-100 mt-1 max-w-2xl">
        A high-precision, offline-resilient terminal designed for wholesalers and pharmacies looking to optimize their inventories, prevent expirations, and run smart operations.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-8">
        <div class="p-6 rounded-2xl border border-amber-400/30 bg-emerald-950/40 space-y-3">
          <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-emerald-300 font-bold text-xs">01</div>
          <h4 class="font-bold text-white text-base">Smart Alerts Center</h4>
          <p class="text-xs text-emerald-200/90 leading-relaxed">Live alarms flagging products expiring soon (2 months threshold) alongside custom low stock parameters per product molecule to optimize inventories.</p>
        </div>
        <div class="p-6 rounded-2xl border border-cyan-400/30 bg-emerald-950/40 space-y-3">
          <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-emerald-300 font-bold text-xs">02</div>
          <h4 class="font-bold text-white text-base">B2B Split Processor</h4>
          <p class="text-xs text-emerald-200/90 leading-relaxed">Accept cash, card, and bank transfers simultaneously on a single invoice, automatically synced with local accounting ledgers.</p>
        </div>
        <div class="p-6 rounded-2xl border border-purple-400/30 bg-emerald-950/40 space-y-3">
          <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-emerald-300 font-bold text-xs">03</div>
          <h4 class="font-bold text-white text-base">AI Consult & Market Intel</h4>
          <p class="text-xs text-emerald-200/90 leading-relaxed">Exclusively for Licensed Pharmacies: instant clinical bio-equivalent lookups, safety checks, and live market intelligence to compare drug prices across distributors.</p>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-emerald-800 pt-6 text-emerald-300 text-xs font-mono">
      <p class="font-semibold text-white">Full-Stack Capability Ready</p>
      <p>Slide 3 of 9</p>
    </div>
  </div>

  <!-- Slide 4: Product Architecture -->
  <div class="slide-page bg-slate-50 text-slate-800">
    <div>
      <span class="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">TECH STACK</span>
      <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-3">
        Production-Grade Resilient Architecture
      </h2>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Designed specifically for emerging markets with intermittent internet connectivity and heavy wholesale-retail transaction volume.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-8">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <span class="text-xs font-bold font-mono text-emerald-800 block uppercase tracking-wider">Client Side</span>
          <div class="space-y-2 text-xs text-slate-700">
            <p class="flex justify-between font-bold border-b pb-1"><span>React 19 & Tailwind</span> <span class="text-slate-400 font-mono text-[10px]">Modern SPA</span></p>
            <p class="flex justify-between font-bold border-b pb-1"><span>Offline-First Engine</span> <span class="text-emerald-700 font-mono text-[10px]">LocalState</span></p>
            <p class="flex justify-between font-bold pb-1"><span>Excel / Bulk Ingestion</span> <span class="text-cyan-700 font-mono text-[10px]">xlsx parser</span></p>
          </div>
          <p class="text-[11px] text-slate-500 leading-normal bg-slate-50 p-3 rounded-lg border">
            Users can import clinical inventories directly from Excel spreadsheets or input them manually using the dynamic form.
          </p>
        </div>

        <div class="bg-[#0a4a3a] p-6 rounded-2xl text-white space-y-4">
          <span class="text-xs font-bold font-mono text-emerald-300 block uppercase tracking-wider">Server Proxy</span>
          <div class="space-y-2 text-xs text-emerald-100">
            <p class="flex justify-between font-bold border-b border-emerald-800 pb-1"><span>Express CJS Bundle</span> <span class="text-emerald-300 font-mono text-[10px]">Secure Node</span></p>
            <p class="flex justify-between font-bold border-b border-emerald-800 pb-1"><span>Gemini Developer SDK</span> <span class="text-amber-300 font-mono text-[10px] font-bold">AI Consult</span></p>
            <p class="flex justify-between font-bold pb-1"><span>API Proxy Layer</span> <span class="text-cyan-300 font-mono text-[10px]">Secure Keys</span></p>
          </div>
          <p class="text-[11px] text-emerald-200 leading-normal bg-emerald-950 p-3 rounded-lg border border-emerald-800">
            Critical API keys (including Gemini and DB credentials) are stored securely on the server-side proxy, completely hidden from client code.
          </p>
        </div>

        <div class="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
          <span class="text-xs font-bold font-mono text-cyan-400 block uppercase tracking-wider">Durable Storage</span>
          <div class="space-y-2 text-xs text-slate-300">
            <p class="flex justify-between font-bold border-b border-slate-800 pb-1"><span>Supabase Realtime DB</span> <span class="text-cyan-400 font-mono text-[10px]">Cloud Ledger</span></p>
            <p class="flex justify-between font-bold border-b border-slate-800 pb-1"><span>Stocktaking Audit Logs</span> <span class="text-indigo-400 font-mono text-[10px]">Immutable</span></p>
            <p class="flex justify-between font-bold pb-1"><span>Payment Split Registry</span> <span class="text-emerald-400 font-mono text-[10px]">Multi-channel</span></p>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal bg-slate-950 p-3 rounded-lg border border-slate-800">
            Integrated database synchronizes changes instantly to remote servers whenever internet connections are live.
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-slate-700">Offline-Capable • High Security</p>
      <p>Slide 4 of 9</p>
    </div>
  </div>

  <!-- Slide 5: Market Opportunity -->
  <div class="slide-page bg-slate-50 text-slate-800">
    <div>
      <span class="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">MARKET METRICS</span>
      <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-3">
        A Sub-Saharan B2B Pharma Market Opportunity
      </h2>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Nigeria is Africa's largest economy with an exploding healthcare, pharmaceutical, and digital payment distribution network.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-8">
        <div class="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between h-48">
          <div>
            <span class="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">TOTAL ADDRESSABLE MARKET (TAM)</span>
            <h3 class="text-3xl font-extrabold font-mono text-emerald-400 mt-1">$4.5 Billion</h3>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            Total annual B2B pharmaceutical sales and digital medical transactions across Sub-Saharan Africa.
          </p>
        </div>

        <div class="bg-[#0a4a3a] text-white p-6 rounded-2xl border border-emerald-800 flex flex-col justify-between h-48">
          <div>
            <span class="text-[10px] font-mono tracking-wider text-emerald-300 uppercase font-bold">SERVICEABLE ADDRESSABLE MARKET (SAM)</span>
            <h3 class="text-3xl font-extrabold font-mono text-amber-400 mt-1">$1.2 Billion</h3>
          </div>
          <p class="text-[11px] text-emerald-100 leading-relaxed">
            Target market size of registered, licensed pharmacies, wholesale medicine depots, and private clinics in Nigeria.
          </p>
        </div>

        <div class="bg-indigo-900 text-white p-6 rounded-2xl border border-indigo-800 flex flex-col justify-between h-48">
          <div>
            <span class="text-[10px] font-mono tracking-wider text-indigo-300 uppercase font-bold">SERVICEABLE OBTAINABLE MARKET (SOM)</span>
            <h3 class="text-3xl font-extrabold font-mono text-cyan-300 mt-1">$250 Million</h3>
          </div>
          <p class="text-[11px] text-slate-200 leading-relaxed">
            Our projected SOM captured in Lagos state distribution channels & direct wholesale network in 5 years.
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-[#0a4a3a]">Rapid Urban Growth Catalyst (Lagos, Abuja, PH)</p>
      <p>Slide 5 of 9</p>
    </div>
  </div>

  <!-- Slide 6: Revenue & Business Model -->
  <div class="slide-page bg-slate-950 text-white">
    <div>
      <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded border border-slate-800">MONETIZATION DEEP-DIVE</span>
      <h2 class="text-3xl font-bold text-white tracking-tight mt-3">
        Diversified High-Margin Revenue Streams
      </h2>
      <p class="text-sm text-slate-400 mt-1 max-w-2xl">
        We leverage SaaS subscription fees and wholesale fintech payment processing splits to guarantee continuous recurring cashflows.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-8">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64">
          <div class="space-y-2">
            <h4 class="font-bold text-white text-base">All-Inclusive Base Subscription</h4>
            <p class="text-xs text-slate-400 leading-normal">
              Base monthly subscription of <span class="font-bold text-emerald-400">₦5,000</span> covers everything—making inventory optimization, digital sales tracking, and AI-powered intelligence easily available and affordable for every retail pharmacy. One subscription covers the AI part.
            </p>
          </div>
          <span class="text-sm font-mono text-emerald-400 font-bold block">Unified Retail Plan</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64">
          <div class="space-y-2">
            <h4 class="font-bold text-white text-base">Tiered Wholesaler Upgrades</h4>
            <p class="text-xs text-slate-400 leading-normal">
              High-volume wholesalers and medical depots can move to premium tiers (<span class="font-bold text-amber-400">₦25,000 to ₦100,000/mo</span>) for advanced multi-location warehouse tracking, advanced logistics, and unlimited split processing.
            </p>
          </div>
          <span class="text-sm font-mono text-amber-400 font-bold block">Wholesaler Scale Tier</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64">
          <div class="space-y-2">
            <h4 class="font-bold text-white text-base">AI Consult & Market Intelligence</h4>
            <p class="text-xs text-slate-400 leading-normal">
              Fully included inside the standard subscription for verified <span class="font-semibold text-purple-300">Licensed Pharmacies</span>. The AI part is also used for market intelligence to compare drug prices across wholesale distributors.
            </p>
          </div>
          <span class="text-sm font-mono text-purple-400 font-bold block">Covered by Standard Plan</span>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-800 pt-6 text-slate-500 text-xs font-mono">
      <p class="font-semibold text-slate-300">Targeting 88% Consolidated Gross Margins</p>
      <p>Slide 6 of 9</p>
    </div>
  </div>

  <!-- Slide 7: Financial Forecast Playground -->
  <div class="slide-page bg-slate-50 text-slate-800">
    <div>
      <span class="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">FINANCIAL MODELER</span>
      <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-3">
        Financial Forecasting Matrix
      </h2>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        Realistic projection of Year 1 & Year 2 annual recurring revenue based on wholesale integrations and pharmacy licensing base packages.
      </p>

      <div class="grid grid-cols-2 gap-6 mt-8">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 class="font-bold text-slate-900 text-sm uppercase font-mono tracking-wider text-slate-500">Default Baseline Variables</h4>
          <div class="space-y-3 text-xs text-slate-700">
            <div class="flex justify-between border-b pb-1">
              <span>Subscribed Retail Pharmacies</span>
              <span class="font-mono font-bold text-[#0a4a3a]">3,000 units</span>
            </div>
            <div class="flex justify-between border-b pb-1">
              <span>Avg Monthly Volume / Pharmacy</span>
              <span class="font-mono font-bold text-[#0a4a3a]">₦4.0 Million</span>
            </div>
            <div class="flex justify-between border-b pb-1">
              <span>Base License Fee / Month</span>
              <span class="font-mono font-bold text-[#0a4a3a]">₦5,000</span>
            </div>
            <div class="flex justify-between border-b pb-1">
              <span>Fintech Settlement Take-Rate</span>
              <span class="font-mono font-bold text-[#0a4a3a]">0.5% Commission</span>
            </div>
          </div>
        </div>

        <div class="bg-[#0a4a3a] text-white p-6 rounded-2xl border border-emerald-800 flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider">Simulated ARR Ledger</span>
            <div class="mt-4">
              <span class="text-xs text-emerald-200 block uppercase font-mono tracking-widest">TOTAL PROVEN ARR</span>
              <span class="text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
                ₦900.00 Million
              </span>
              <p class="text-[11px] text-emerald-200/80 mt-2">
                Consolidated from <span class="font-bold text-white">₦180.0M</span> Base SaaS License Fee and <span class="font-bold text-white">₦720.0M</span> split transaction settlement commission.
              </p>
            </div>
          </div>

          <div class="space-y-1 mt-4 border-t border-emerald-800 pt-4">
            <div class="flex justify-between text-xs font-mono text-emerald-300">
              <span>Gross Profit (88% Margins)</span>
              <span class="font-bold text-white">₦792.00M</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-[#0a4a3a]">Scale modeling is strictly representative and dynamic</p>
      <p>Slide 7 of 9</p>
    </div>
  </div>

  <!-- Slide 8: Strategic Roadmap -->
  <div class="slide-page bg-slate-50 text-slate-800">
    <div>
      <span class="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">GROWTH BLUEPRINT</span>
      <h2 class="text-3xl font-bold text-slate-900 tracking-tight mt-3">
        Our Validation & Expansion Roadmaps
      </h2>
      <p class="text-sm text-slate-500 mt-1 max-w-2xl">
        From our current Lagos clinic pilot network to a comprehensive, fully automated Sub-Saharan pharmaceutical B2B marketplace.
      </p>

      <div class="grid grid-cols-3 gap-6 mt-8">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <span class="text-xs font-mono font-extrabold text-[#0a4a3a] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full inline-block">
            PHASE 1: Q3 - Q4 2026
          </span>
          <h4 class="font-bold text-slate-950 text-base">Direct Local Clearinghouses</h4>
          <p class="text-xs text-slate-600 leading-relaxed">
            Integrate raw bank transfer protocols from top Nigerian settlement banks (GTBank, Access, Zenith) directly into our Split Payment processor.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <span class="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full inline-block">
            PHASE 2: Q1 - Q2 2027
          </span>
          <h4 class="font-bold text-slate-950 text-base">National Deployment</h4>
          <p class="text-xs text-slate-600 leading-relaxed">
            Partner with national wholesale medical distributors to deploy Pocket Pharmacy terminals to over 2,500 active regional depots.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <span class="text-xs font-mono font-extrabold text-purple-800 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full inline-block">
            PHASE 3: Q3 - Q4 2027
          </span>
          <h4 class="font-bold text-slate-950 text-base">Automated Marketplace</h4>
          <p class="text-xs text-slate-600 leading-relaxed">
            Leverage low stock alarms to automatically trigger purchase orders back to approved drug manufacturers via B2B APIs.
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-[#0a4a3a]">Scaling with clinical precision and speed</p>
      <p>Slide 8 of 9</p>
    </div>
  </div>

  <!-- Slide 9: Why Invest & CTA -->
  <div class="slide-page bg-gradient-to-br from-[#0a4a3a] via-slate-950 to-emerald-950 text-white relative overflow-hidden">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <span class="bg-white text-[#0a4a3a] font-black text-base px-2 py-0.5 rounded">+</span>
        <span class="font-mono text-xs font-bold tracking-wider text-emerald-300">POCKET PHARMACY B2B</span>
      </div>
      <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
        THE NEXT UNICORN
      </span>
    </div>

    <div class="my-auto space-y-5 max-w-2xl">
      <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-white">
        Join Us in Digitizing Africa's Clinical Logistics
      </h2>
      <p class="text-sm sm:text-base font-light text-slate-300 leading-relaxed">
        We are raising our <span class="font-semibold text-emerald-400">Pre-Seed round of $100,000 USD</span> to expand pilot deployments in Lagos, secure clinical partner licenses, and build out automated inventory marketplace triggers.
      </p>

      <div class="grid grid-cols-2 gap-4 text-xs font-mono text-emerald-200">
        <p>✓ Validated Product & Sync Engine</p>
        <p>✓ 88% High-Margin Recurring Model</p>
        <p>✓ Targeting $4.5B Sub-Saharan Spend</p>
        <p>✓ Empowered by Gemini AI Agents</p>
      </div>

      <div class="bg-emerald-950/80 border border-emerald-800 p-5 rounded-xl max-w-sm mt-4 text-xs space-y-1.5 text-slate-300">
        <p class="font-bold text-white uppercase tracking-wider font-mono text-emerald-300">Investor Relations Contact</p>
        <p>📩 <span class="font-semibold text-white">onyemekamichael@gmail.com</span></p>
        <p>📍 Lagos, Nigeria</p>
      </div>
    </div>

    <div class="flex justify-between items-center border-t border-white/10 pt-6 text-slate-400 text-xs font-mono">
      <p class="font-semibold text-slate-300">Pocket Pharmacy • Clinical POS Suite v2.5</p>
      <p>Slide 9 of 9 • Thank You</p>
    </div>
  </div>

  <script>
    // Prompt print automatically on load
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 800);
    });
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const slides = [
    // Slide 0: Title Cover
    {
      title: "Title Cover",
      render: () => (
        <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a4a3a] to-indigo-950">
          {/* Ambient light flares */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
          
          {/* Slide Header */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#0a4a3a] stroke-[3px]" />
              </div>
              <span className="font-mono text-xs font-bold tracking-wider text-emerald-300">POCKET PHARMACY B2B</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              INVESTOR DECK 2026
            </span>
          </div>

          {/* Main Hero block */}
          <div className="my-auto space-y-6 z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Re-Engineering Pharmaceutical Logistics in Emerging Markets
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold font-display leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-cyan-100">
              Pocket Pharmacy
            </h1>
            
            <p className="text-lg sm:text-2xl font-light text-slate-200 leading-relaxed max-w-2xl">
              An integrated <span className="font-semibold text-emerald-400">Clinical POS, Real-Time Inventory, & AI Decision Suite</span> for pharmacies and clinical wholesalers.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <span className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" /> POS Terminals
              </span>
              <span className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" /> Live Cloud Sync
              </span>
              <span className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Gemini AI Integration
              </span>
            </div>
          </div>

          {/* Footnote */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/10 pt-6 z-10 text-slate-400 text-xs font-mono">
            <div>
              <p className="font-bold text-slate-300">Market Focus: Lagos, Nigeria</p>
              <p className="text-slate-500">Sub-Saharan Africa Wholesale & Retail Expansion</p>
            </div>
            <p>Slide 1 / 9 • Press Right Key or Click Next</p>
          </div>
        </div>
      )
    },

    // Slide 1: The Problem
    {
      title: "The Core Problems",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-slate-800 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">B2B INEFFICIENCY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
              The Trillion-Naira Pharmacy Leakage
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Pharmacies looking to optimize their inventories and clinical distributors across Africa run on fragmented tools, resulting in catastrophic business and clinical leakages.
            </p>

            {/* Problem cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
              {[
                {
                  title: "1. Catastrophic Medicine Expirations",
                  desc: "₦340B+ lost in waste annually in West Africa. Shelf-life tracking is manual or completely ignored until drugs have expired and must be destroyed.",
                  icon: Clock,
                  iconBg: "bg-amber-100 text-amber-800",
                  border: "border-amber-200"
                },
                {
                  title: "2. Destructive Stockouts & Overstocks",
                  desc: "Critical medicines (such as insulin, oncology pills) are often out-of-stock. Stocktaking audits are infrequent, leading to severe inventory mismatches.",
                  icon: ShieldAlert,
                  iconBg: "bg-red-100 text-red-800",
                  border: "border-red-200"
                },
                {
                  title: "3. Rigid B2B Wholesale Payment Bottlenecks",
                  desc: "Cash, direct card swiping, and slow bank transfers cause friction. Over 70% of transactions require complex combinations of payment methods on single orders.",
                  icon: DollarSign,
                  iconBg: "bg-emerald-100 text-emerald-800",
                  border: "border-emerald-200"
                },
                {
                  title: "4. Pharmacovigilance & Decision Deficits",
                  desc: "Cashiers lack instant access to clinical knowledge: verifying prescription-only medicine (POM) guidelines or matching generic bio-equivalents on-the-spot.",
                  icon: AlertCircle,
                  iconBg: "bg-indigo-100 text-indigo-800",
                  border: "border-indigo-200"
                }
              ].map((prob, i) => {
                const Icon = prob.icon;
                return (
                  <div key={i} className={`bg-white p-5 rounded-2xl border ${prob.border} shadow-sm space-y-3`}>
                    <div className="flex items-center gap-3">
                      <div className={`${prob.iconBg} p-2 rounded-xl`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{prob.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{prob.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-[#0a4a3a]">Validated by Lagos Clinical Practice Audits</p>
            <p>Slide 2 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 2: The Solution
    {
      title: "Our Solution",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-white bg-[#0a4a3a] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">THE REVOLUTION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              One Unified, Intelligent Clinical POS Suite
            </h2>
            <p className="text-sm text-emerald-100 mt-1 max-w-2xl">
              A high-precision, offline-resilient terminal designed for wholesalers and pharmacies looking to optimize their inventories, prevent expirations, and run smart operations.
            </p>

            {/* Solution Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                {
                  title: "Smart Alerts Center",
                  desc: "Live alarms flagging products expiring soon (2 months threshold) alongside custom low stock parameters per product molecule to optimize inventories.",
                  color: "border-amber-400/30 bg-emerald-950/40"
                },
                {
                  title: "B2B Split Processor",
                  desc: "Accept cash, card, and bank transfers simultaneously on a single invoice, automatically synced with local accounting ledgers.",
                  color: "border-cyan-400/30 bg-emerald-950/40"
                },
                {
                  title: "AI Consult & Market Intel",
                  desc: "Exclusively for Licensed Pharmacies: instant clinical bio-equivalent lookups, safety checks, and live market intelligence to compare drug prices across distributors.",
                  color: "border-purple-400/30 bg-emerald-950/40"
                }
              ].map((sol, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${sol.color} space-y-3`}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-mono text-emerald-300 font-bold">
                    0{i+1}
                  </div>
                  <h4 className="font-bold text-white text-base">{sol.title}</h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">{sol.desc}</p>
                </div>
              ))}
            </div>

            {/* Success Bar */}
            <div className="bg-emerald-950/80 border border-emerald-800 rounded-xl p-4 mt-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-100 font-medium">
                <span className="font-bold text-emerald-300">Live & Operational:</span> Our cloud replica automatically syncs to remote servers, with automatic offline fallback to local database storage.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-emerald-800 pt-6 text-emerald-300 text-xs font-mono">
            <p className="font-semibold text-white">Full-Stack Capability Ready</p>
            <p>Slide 3 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 3: Product In-Action Demo
    {
      title: "Product Architecture",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-slate-800 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">TECH STACK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
              Production-Grade Resilient Architecture
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Designed specifically for emerging markets with intermittent internet connectivity and heavy wholesale-retail transaction volume.
            </p>

            {/* Tech flow details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-xs font-bold font-mono text-emerald-800 block uppercase tracking-wider">Client Side</span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">React 19 & Tailwind</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">Modern SPA</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Offline-First Engine</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">LocalState</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-bold text-slate-800">Excel / Bulk Ingestion</span>
                    <span className="text-[10px] bg-cyan-50 text-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">xlsx parser</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[11px] text-slate-500 leading-normal font-medium">
                    Users can import clinical inventories directly from Excel spreadsheets or input them manually using the dynamic form.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#0a4a3a] p-6 rounded-2xl text-white space-y-4">
                <span className="text-xs font-bold font-mono text-emerald-300 block uppercase tracking-wider">Server Proxy (No Leakage)</span>
                <div className="space-y-3 text-emerald-100">
                  <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                    <span className="text-xs font-bold">Express CJS Bundle</span>
                    <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Secure Node</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                    <span className="text-xs font-bold">Gemini Developer SDK</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">AI Consult</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-bold">API Proxy Layer</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">Secure Keys</span>
                  </div>
                </div>
                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800">
                  <p className="text-[11px] text-emerald-200 leading-normal font-medium">
                    Critical API keys (including Gemini and DB credentials) are stored securely on the server-side proxy, completely hidden from client code.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold font-mono text-cyan-400 block uppercase tracking-wider font-bold">Durable Storage</span>
                <div className="space-y-3 text-slate-300">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold">Supabase Realtime DB</span>
                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400 font-mono">Cloud Ledger</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold">Stocktaking Audit Logs</span>
                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-indigo-400 font-mono">Immutable</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs font-bold">Payment Split Registry</span>
                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono">Multi-channel</span>
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] text-slate-400 leading-normal font-medium">
                    Integrated database synchronizes changes instantly to remote servers whenever internet connections are live.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-slate-700">Offline-Capable • High Security</p>
            <p>Slide 4 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 4: Market Size (TAM / SAM / SOM)
    {
      title: "Market Opportunity",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-slate-800 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">MARKET METRICS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
              A Sub-Saharan B2B Pharma Market Opportunity
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Nigeria is Africa's largest economy with an exploding healthcare, pharmaceutical, and digital payment distribution network.
            </p>

            {/* TAM SAM SOM cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              
              {/* TAM */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between h-48">
                <div className="absolute top-0 right-0 p-3 opacity-15">
                  <TrendingUp className="w-24 h-24 stroke-[1px]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">TOTAL ADDRESSABLE MARKET (TAM)</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1">$4.5 Billion</h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed z-10">
                  Total annual B2B pharmaceutical sales and digital medical transactions across Sub-Saharan Africa.
                </p>
              </div>

              {/* SAM */}
              <div className="bg-gradient-to-br from-[#0a4a3a] to-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 relative overflow-hidden flex flex-col justify-between h-48">
                <div className="absolute top-0 right-0 p-3 opacity-15">
                  <Target className="w-24 h-24 stroke-[1px]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-emerald-300 uppercase font-bold">SERVICEABLE ADDRESSABLE MARKET (SAM)</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 mt-1">$1.2 Billion</h3>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed z-10">
                  Target market size of registered, licensed pharmacies, wholesale medicine depots, and private clinics in Nigeria.
                </p>
              </div>

              {/* SOM */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 relative overflow-hidden flex flex-col justify-between h-48">
                <div className="absolute top-0 right-0 p-3 opacity-15">
                  <Users className="w-24 h-24 stroke-[1px]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-indigo-300 uppercase font-bold">SERVICEABLE OBTAINABLE MARKET (SOM)</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300 mt-1">$250 Million</h3>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed z-10">
                  Our projected SOM captured in Lagos state distribution channels & direct wholesale network in 5 years.
                </p>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-[#0a4a3a]">Rapid Urban Growth Catalyst (Lagos, Abuja, PH)</p>
            <p>Slide 5 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 5: Revenue & Business Model
    {
      title: "Commercial & Business Model",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-white bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded border border-slate-800">MONETIZATION DEEP-DIVE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              Diversified High-Margin Revenue Streams
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              We leverage SaaS subscription fees and wholesale fintech payment processing splits to guarantee continuous recurring cashflows.
            </p>

            {/* Model columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              
              {/* SaaS model */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64 hover:border-[#0a4a3a] transition-all">
                <div className="space-y-2">
                  <div className="bg-emerald-500/10 p-2 rounded-lg w-9 h-9 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-base">All-Inclusive Base Subscription</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Base monthly subscription of <span className="font-bold text-emerald-400">₦5,000</span> covers everything—making inventory optimization, digital sales tracking, and AI-powered intelligence easily available and affordable for every retail pharmacy. One subscription covers the AI part.
                  </p>
                </div>
                <span className="text-sm font-mono text-emerald-400 font-bold block pt-4">Unified Retail Plan</span>
              </div>

              {/* Transaction Fee model / Wholesaler Tiers */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64 hover:border-amber-500/30 transition-all">
                <div className="space-y-2">
                  <div className="bg-amber-500/10 p-2 rounded-lg w-9 h-9 flex items-center justify-center text-amber-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-base">Tiered Wholesaler Upgrades</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    High-volume wholesalers and medical depots can move to premium tiers (<span className="font-bold text-amber-400">₦25,000 to ₦100,000/mo</span>) for advanced multi-location warehouse tracking, advanced logistics, and unlimited split processing.
                  </p>
                </div>
                <span className="text-sm font-mono text-amber-400 font-bold block pt-4">Wholesaler Scale Tier</span>
              </div>

              {/* Value Add model */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-64 hover:border-purple-500/30 transition-all">
                <div className="space-y-2">
                  <div className="bg-purple-500/10 p-2 rounded-lg w-9 h-9 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-base">AI Consult & Market Intelligence</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Fully included inside the standard subscription for verified <span className="font-semibold text-purple-300">Licensed Pharmacies</span>. The AI part is also used for market intelligence to compare drug prices across wholesale distributors.
                  </p>
                </div>
                <span className="text-sm font-mono text-purple-400 font-bold block pt-4">Covered by Standard Plan</span>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-6 text-slate-500 text-xs font-mono">
            <p className="font-semibold text-slate-300">Targeting 88% Consolidated Gross Margins</p>
            <p>Slide 6 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 6: Interactive Forecaster Playground (The "Commercial Viable" highlight)
    {
      title: "Interactive Financial Forecaster",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-slate-800 bg-slate-50 selection:bg-emerald-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">FINANCIAL MODELER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Interactive Revenue Forecaster Playground
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Drag the interactive sliders below to simulate realistic ARR and Gross Profit forecast metrics for Pocket Pharmacy.
            </p>

            {/* Forecaster Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              
              {/* Sliders Container (5 cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-xs font-bold font-mono text-slate-500 block uppercase tracking-wider">Simulation Inputs</span>
                
                {/* Sliders 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Subscribed Pharmacies</span>
                    <span className="font-mono font-bold text-[#0a4a3a] bg-emerald-50 px-2 py-0.5 rounded">{subscribedPharmacies.toLocaleString()} units</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={subscribedPharmacies}
                    onChange={(e) => setSubscribedPharmacies(parseInt(e.target.value))}
                    className="w-full accent-[#0a4a3a] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>100</span>
                    <span>10,000</span>
                  </div>
                </div>

                {/* Sliders 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Avg Monthly Wholesale Vol / Pharmacy</span>
                    <span className="font-mono font-bold text-[#0a4a3a] bg-emerald-50 px-2 py-0.5 rounded">₦{(avgMonthlyVolume / 1000000).toFixed(1)} Million</span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="15000000"
                    step="250000"
                    value={avgMonthlyVolume}
                    onChange={(e) => setAvgMonthlyVolume(parseInt(e.target.value))}
                    className="w-full accent-[#0a4a3a] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>₦0.5M</span>
                    <span>₦15.0M</span>
                  </div>
                </div>

                {/* Sliders 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">Monthly License Fee (Tiered)</span>
                    <span className="font-mono font-bold text-[#0a4a3a] bg-emerald-50 px-2 py-0.5 rounded">₦{monthlySaasFee.toLocaleString()} / mo</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="5000"
                    value={monthlySaasFee}
                    onChange={(e) => setMonthlySaasFee(parseInt(e.target.value))}
                    className="w-full accent-[#0a4a3a] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>₦5,000 (Base Pharmacy)</span>
                    <span>₦100,000 (Enterprise Wholesaler)</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs Container (7 cols) */}
              <div className="lg:col-span-7 bg-[#0a4a3a] text-white p-5 rounded-2xl border border-emerald-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider">Simulated ARR Ledger</span>
                    <span className="bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded text-[10px] text-emerald-300 font-bold uppercase tracking-wider font-mono">Live Forecast</span>
                  </div>

                  {/* Big Number output */}
                  <div className="mt-4">
                    <span className="text-xs text-emerald-200 block uppercase font-mono tracking-widest leading-none font-semibold">TOTAL ARR (SAAS + PROCESSING FEES)</span>
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-cyan-300">
                      ₦{(financialMetrics.totalARR / 1000000).toFixed(2)} Million
                    </span>
                    <p className="text-[11px] text-emerald-200/80 mt-1">
                      Consolidated from: 
                      <span className="font-bold text-white font-mono"> ₦{(financialMetrics.annualSaas / 1000000).toFixed(1)}M SaaS</span> + 
                      <span className="font-bold text-white font-mono"> ₦{(financialMetrics.annualTxFees / 1000000).toFixed(1)}M Settlement Comissions (0.5%)</span>.
                    </p>
                  </div>
                </div>

                {/* Profit bar visualizer */}
                <div className="space-y-1.5 pt-4 mt-4 border-t border-emerald-800">
                  <div className="flex justify-between text-xs font-mono text-emerald-300">
                    <span>Gross Profit (88% Margins)</span>
                    <span className="font-bold text-white">₦{(financialMetrics.grossProfit / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="w-full bg-emerald-950 rounded-full h-3 border border-emerald-800 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300" 
                      style={{ width: "88%" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-300 italic">
                    * Low platform storage and host costs yield exceptional margins typical of modern software infrastructures.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-4 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-[#0a4a3a]">Live calculations verified by model matrices</p>
            <p>Slide 7 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 7: Roadmap
    {
      title: "Strategic Roadmap",
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-slate-800 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#0a4a3a] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded">GROWTH BLUEPRINT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
              Our Validation & Expansion Roadmaps
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              From our current Lagos clinic pilot network to a comprehensive, fully automated Sub-Saharan pharmaceutical B2B marketplace.
            </p>

            {/* Timeline steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden space-y-3 hover:border-emerald-500 transition-all">
                <span className="text-xs font-mono font-extrabold text-[#0a4a3a] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full inline-block">
                  PHASE 1: Q3 - Q4 2026
                </span>
                <h4 className="font-bold text-slate-950 text-base">Direct Local Clearinghouses</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integrate raw bank transfer protocols from top Nigerian settlement banks (GTBank, Access, Zenith) directly into our Split Payment processor.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden space-y-3 hover:border-amber-500 transition-all">
                <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full inline-block">
                  PHASE 2: Q1 - Q2 2027
                </span>
                <h4 className="font-bold text-slate-950 text-base">National Deployment (Abuja & PH)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Partner with national wholesale medical distributors to deploy Pocket Pharmacy terminals to over 2,500 active regional depots.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 relative overflow-hidden space-y-3 hover:border-purple-500 transition-all">
                <span className="text-xs font-mono font-extrabold text-purple-800 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full inline-block">
                  PHASE 3: Q3 - Q4 2027
                </span>
                <h4 className="font-bold text-slate-950 text-base">Automated Marketplace Orders</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Leverage low stock alarms to automatically trigger purchase orders back to approved drug manufacturers via B2B APIs.
                </p>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-6 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-[#0a4a3a]">Scaling with clinical precision and speed</p>
            <p>Slide 8 / 9</p>
          </div>
        </div>
      )
    },

    // Slide 8: Why Invest & CTA
    {
      title: "Why Invest / CTA",
      render: () => (
        <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden bg-gradient-to-br from-[#0a4a3a] via-slate-950 to-emerald-950">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded">
                <Plus className="w-4 h-4 text-[#0a4a3a] stroke-[3px]" />
              </div>
              <span className="font-mono text-xs font-bold tracking-wider text-emerald-300">POCKET PHARMACY B2B</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
              THE NEXT UNICORN
            </span>
          </div>

          {/* CTA middle block */}
          <div className="my-auto space-y-5 z-10 max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight text-white">
              Join Us in Digitizing Africa's Clinical Logistics
            </h2>
            <p className="text-sm sm:text-base font-light text-slate-300 leading-relaxed">
              We are raising our <span className="font-semibold text-emerald-400">Pre-Seed round of $100,000 USD</span> to expand pilot deployments in Lagos, secure clinical partner licenses, and build out automated inventory marketplace triggers.
            </p>

            {/* Why Invest Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-mono text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Validated Product & Sync Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>88% High-Margin Recurring Model</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Targeting $4.5B Sub-Saharan Spend</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Empowered by Gemini AI Agents</span>
              </div>
            </div>

            {/* Contact info card */}
            <div className="bg-emerald-950/80 border border-emerald-800 p-4 rounded-xl max-w-sm mt-4 text-xs space-y-1.5 text-slate-300">
              <p className="font-bold text-white uppercase tracking-wider font-mono text-emerald-300">Investor Relations Contact</p>
              <p>📩 <span className="font-semibold text-white">onyemekamichael@gmail.com</span></p>
              <p>📍 Lagos, Nigeria</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/10 pt-6 z-10 text-slate-400 text-xs font-mono">
            <p className="font-semibold text-slate-300">Pocket Pharmacy • Clinical POS Suite v2.5</p>
            <p>Slide 9 / 9 • Thank You</p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[600px] sm:h-[680px]"
      >
        {/* Top bar with close */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm tracking-tight text-slate-200">Pocket Pharmacy B2B Investor Presentation</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintPDF}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md border border-emerald-500/30"
              title="Print or Save Pitch Deck as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-[11px] font-mono font-bold text-slate-400">
              <span>Press</span>
              <kbd className="bg-slate-800 text-white px-1 rounded">←</kbd>
              <span>or</span>
              <kbd className="bg-slate-800 text-white px-1 rounded">→</kbd>
              <span>to navigate</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Slide Content viewport */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {slides[currentSlide].render()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation bottom footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 flex justify-between items-center text-white">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === currentSlide 
                    ? "bg-emerald-400 w-6" 
                    : "bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-800 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
              className="bg-[#0a4a3a] hover:bg-[#073a2e] disabled:bg-slate-950 disabled:text-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all border border-emerald-800 flex items-center gap-1.5 shadow-md"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
