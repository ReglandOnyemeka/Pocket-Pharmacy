import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Database, 
  Sparkles, 
  Lock, 
  LogOut, 
  Upload, 
  Check, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Coins,
  Layers, 
  ChevronRight, 
  FileSpreadsheet, 
  User, 
  Users,
  UserPlus,
  CheckCircle2, 
  Info,
  Clock,
  Printer,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  Share2,
  Smartphone,
  Send,
  Mail,
  FileText,
  Bell,
  AlertCircle,
  X,
  Building2,
  Building,
  ShieldCheck
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Product {
  id: string;
  name: string;
  api_molecule: string;
  category: string;
  price: number;
  cost_price?: number;
  quantity: number;
  pom: boolean;
  created_at?: string;
  low_stock_threshold?: number;
  expiry_month?: number;
  expiry_year?: number;
  drug_type?: string;
  pharmacyId?: string;
}

const DRUG_TYPES = [
  "Tablet",
  "Capsule",
  "Bottle",
  "Injection",
  "Infusion",
  "Suspension",
  "Syrup",
  "Cream / Ointment",
  "Inhaler",
  "Other"
];

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesRecord {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  cashPaid: number;
  transferPaid: number;
  cardPaid: number;
  pharmacyId?: string;
  userId?: string;
  userName?: string;
}

interface StockAuditEntry {
  id: string;
  date: string;
  productName: string;
  appCount: number;
  shelfCount: number;
  discrepancy: number;
  reason: string;
  timestamp: string;
  pharmacyId?: string;
  userId?: string;
  userName?: string;
}

interface StockFrequency {
  id: string;
  frequency: "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
  targetDayOrDate: string;
  timeOfDay: string;
  notes: string;
  enableAppNotification?: boolean;
  enableEmailNotification?: boolean;
  notificationEmail?: string;
  pharmacyId?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  directorName: string;
  location: string;
  phone: string;
  email: string;
}

interface AppUser {
  id: string;
  pharmacyId: string;
  username: string;
  pinCode: string;
  role: "cashier" | "admin" | "super_admin";
  location: string;
  features: string[];
}

const validatePassword = (pass: string): { valid: boolean; message: string } => {
  const p = pass.trim();
  if (p.length < 6 || p.length > 10) {
    return { valid: false, message: "Password must be 6 to 10 characters long." };
  }
  const hasLetter = /[a-zA-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);
  if (!hasLetter || !hasNumber || !hasSpecial) {
    return { valid: false, message: "Password must contain a mix of letters, numbers, and special characters (e.g. @, #, $)." };
  }
  return { valid: true, message: "" };
};

const DEFAULT_PHARMACIES: Pharmacy[] = [
  {
    id: "gpharm-lagos-hq",
    name: "GPharm Lagos Headquarters",
    directorName: "Dr. Michael Onyeka",
    location: "Lagos, Nigeria",
    phone: "+234 803 123 4567",
    email: "onyemekamichael@gmail.com"
  }
];

const DEFAULT_USERS: AppUser[] = [
  {
    id: "user-super",
    pharmacyId: "gpharm-lagos-hq",
    username: "superadmin",
    pinCode: "Super1@",
    role: "super_admin",
    location: "Lagos Headquarters",
    features: ["sales", "inventory", "audits", "ai_consult", "admin_panel"]
  },
  {
    id: "user-admin",
    pharmacyId: "gpharm-lagos-hq",
    username: "admin",
    pinCode: "Admin1#",
    role: "admin",
    location: "Lagos Branch A",
    features: ["sales", "inventory", "audits", "ai_consult"]
  },
  {
    id: "user-cashier",
    pharmacyId: "gpharm-lagos-hq",
    username: "cashier",
    pinCode: "Cash1$",
    role: "cashier",
    location: "Lagos Branch B",
    features: ["sales"]
  }
];

// Supabase Configuration from Prompt
const SUPABASE_URL = "https://pfjfdnwaatiacqgwbsuf.supabase.co";
const SUPABASE_KEY = "sb_publishable_-WC3BTgSny08Oya6VmdBlA_znweCfNH";

// Initial mock data focusing on realistic pharmaceutical products in Lagos
const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Amoxil 500mg", api_molecule: "Amoxicillin", category: "Antibiotics", price: 4500, cost_price: 3150, quantity: 24, pom: true, low_stock_threshold: 15, expiry_month: 11, expiry_year: 2026, drug_type: "Capsule", pharmacyId: "gpharm-lagos-hq" },
  { id: "2", name: "Panadol Extra", api_molecule: "Paracetamol / Caffeine", category: "Analgesics", price: 1200, cost_price: 840, quantity: 150, pom: false, low_stock_threshold: 30, expiry_month: 12, expiry_year: 2027, drug_type: "Tablet", pharmacyId: "gpharm-lagos-hq" },
  { id: "3", name: "Augmentin 625mg", api_molecule: "Co-amoxiclav", category: "Antibiotics", price: 18500, cost_price: 13000, quantity: 8, pom: true, low_stock_threshold: 12, expiry_month: 8, expiry_year: 2026, drug_type: "Tablet", pharmacyId: "gpharm-lagos-hq" }, // Low stock & expiring soon (Aug 2026)
  { id: "4", name: "Lonart DS", api_molecule: "Artemether / Lumefantrine", category: "Antimalarials", price: 2500, cost_price: 1750, quantity: 55, pom: false, low_stock_threshold: 20, expiry_month: 10, expiry_year: 2027, drug_type: "Tablet", pharmacyId: "gpharm-lagos-hq" },
  { id: "5", name: "Rocephin 1g Injection", api_molecule: "Ceftriaxone", category: "Antibiotics", price: 9000, cost_price: 6300, quantity: 4, pom: true, low_stock_threshold: 10, expiry_month: 9, expiry_year: 2026, drug_type: "Injection", pharmacyId: "gpharm-lagos-hq" }, // Low stock & expiring soon (Sept 2026)
  { id: "6", name: "Ventolin Inhaler", api_molecule: "Salbutamol", category: "Inhalers & Respiratory", price: 7200, cost_price: 5040, quantity: 35, pom: true, low_stock_threshold: 10, expiry_month: 4, expiry_year: 2027, drug_type: "Inhaler", pharmacyId: "gpharm-lagos-hq" },
  { id: "7", name: "Glucophage 500mg", api_molecule: "Metformin", category: "Antidiabetics", price: 3800, cost_price: 2660, quantity: 42, pom: true, low_stock_threshold: 15, expiry_month: 5, expiry_year: 2027, drug_type: "Tablet", pharmacyId: "gpharm-lagos-hq" },
  { id: "8", name: "Lipitor 20mg", api_molecule: "Atorvastatin", category: "Antihypertensives & Cardio", price: 12500, cost_price: 8750, quantity: 18, pom: true, low_stock_threshold: 15, expiry_month: 7, expiry_year: 2026, drug_type: "Tablet", pharmacyId: "gpharm-lagos-hq" }, // Expiring this month (July 2026)
  { id: "9", name: "Gaviscon Suspension 250ml", api_molecule: "Sodium Alginate / Antacid", category: "Antacids & Gastro", price: 5000, cost_price: 3500, quantity: 12, pom: false, low_stock_threshold: 5, expiry_month: 3, expiry_year: 2027, drug_type: "Suspension", pharmacyId: "gpharm-lagos-hq" },
  { id: "10", name: "Ventolin Nebules 2.5mg", api_molecule: "Salbutamol", category: "Inhalers & Respiratory", price: 8000, cost_price: 5600, quantity: 3, pom: true, low_stock_threshold: 8, expiry_month: 12, expiry_year: 2026, drug_type: "Other", pharmacyId: "gpharm-lagos-hq" } // Low stock
];

const DRUG_CATEGORIES = [
  "All Categories",
  "Antibiotics",
  "Analgesics",
  "Antimalarials",
  "Antihypertensives & Cardio",
  "Antidiabetics",
  "Antacids & Gastro",
  "Inhalers & Respiratory",
  "Vitamins & Supplements"
];

interface DrugApiMapping {
  name: string;
  api: string;
  category: string;
}

const DEFAULT_DRUG_API_KNOWLEDGE: DrugApiMapping[] = [
  // Antibiotics
  { name: "Amoxil 500mg", api: "Amoxicillin", category: "Antibiotics" },
  { name: "Augmentin 625mg", api: "Co-amoxiclav", category: "Antibiotics" },
  { name: "Zinnat 500mg", api: "Cefuroxime", category: "Antibiotics" },
  { name: "Rocephin 1g Injection", api: "Ceftriaxone", category: "Antibiotics" },
  { name: "Flagyl 400mg", api: "Metronidazole", category: "Antibiotics" },
  { name: "Ciprotab 500mg", api: "Ciprofloxacin", category: "Antibiotics" },
  { name: "Azithromycin 500mg", api: "Azithromycin", category: "Antibiotics" },
  { name: "Doxycycline 100mg", api: "Doxycycline", category: "Antibiotics" },
  { name: "Erythrocin 250mg", api: "Erythromycin", category: "Antibiotics" },
  
  // Analgesics
  { name: "Panadol Extra", api: "Paracetamol / Caffeine", category: "Analgesics" },
  { name: "Panadol 500mg", api: "Paracetamol", category: "Analgesics" },
  { name: "Emcap Extra", api: "Paracetamol", category: "Analgesics" },
  { name: "Ibuprofen 400mg", api: "Ibuprofen", category: "Analgesics" },
  { name: "Cataflam 50mg", api: "Diclofenac Potassium", category: "Analgesics" },
  { name: "Voltaren 50mg", api: "Diclofenac Sodium", category: "Analgesics" },
  { name: "Tramadol 50mg", api: "Tramadol", category: "Analgesics" },
  { name: "Felvin 20mg", api: "Piroxicam", category: "Analgesics" },

  // Antimalarials
  { name: "Lonart DS", api: "Artemether / Lumefantrine", category: "Antimalarials" },
  { name: "Coartem 80/480", api: "Artemether / Lumefantrine", category: "Antimalarials" },
  { name: "Malar-2 (Adult)", api: "Artemether / Lumefantrine", category: "Antimalarials" },
  { name: "Amatem Softgel", api: "Artemether / Lumefantrine", category: "Antimalarials" },
  { name: "Fansidar", api: "Sulfadoxine / Pyrimethamine", category: "Antimalarials" },
  { name: "Quinine 300mg", api: "Quinine Sulfate", category: "Antimalarials" },

  // Antihypertensives & Cardio
  { name: "Lipitor 20mg", api: "Atorvastatin", category: "Antihypertensives & Cardio" },
  { name: "Norvasc 10mg", api: "Amlodipine", category: "Antihypertensives & Cardio" },
  { name: "Co-Diovan 160mg", api: "Valsartan / Hydrochlorothiazide", category: "Antihypertensives & Cardio" },
  { name: "Moduretic", api: "Amiloride / Hydrochlorothiazide", category: "Antihypertensives & Cardio" },
  { name: "Lisumpress 10mg", api: "Lisinopril", category: "Antihypertensives & Cardio" },
  { name: "Vasoprin 75mg", api: "Aspirin", category: "Antihypertensives & Cardio" },

  // Inhalers & Respiratory
  { name: "Ventolin Inhaler", api: "Salbutamol", category: "Inhalers & Respiratory" },
  { name: "Ventolin Nebules 2.5mg", api: "Salbutamol", category: "Inhalers & Respiratory" },
  { name: "Seretide Evohaler", api: "Fluticasone / Salmeterol", category: "Inhalers & Respiratory" },
  { name: "Prospan Syrup", api: "Hedera Helix Extract", category: "Inhalers & Respiratory" },

  // Antacids & Gastro
  { name: "Gaviscon Suspension 250ml", api: "Sodium Alginate / Antacid", category: "Antacids & Gastro" },
  { name: "Omeprazole 20mg", api: "Omeprazole", category: "Antacids & Gastro" },
  { name: "Gestid Suspension", api: "Magnesium Trisilicate", category: "Antacids & Gastro" },

  // Antidiabetics
  { name: "Glucophage 500mg", api: "Metformin", category: "Antidiabetics" },
  { name: "Daonil 5mg", api: "Glibenclamide", category: "Antidiabetics" },
  { name: "Januvia 100mg", api: "Sitagliptin", category: "Antidiabetics" },

  // Vitamins & Supplements
  { name: "Astymin Liquid", api: "Amino Acids / Multivitamins", category: "Vitamins & Supplements" },
  { name: "Sangobion Capsules", api: "Ferrous Gluconate / Folic Acid", category: "Vitamins & Supplements" },
  { name: "Vitamin C 100mg", api: "Ascorbic Acid", category: "Vitamins & Supplements" }
];

const generateMockSales = (): SalesRecord[] => {
  const records: SalesRecord[] = [];
  const now = new Date();
  
  const itemsPool = [
    { name: "Co-Diovan 160mg", price: 14500 },
    { name: "Malar-2 (Adult)", price: 1800 },
    { name: "Zinnat 500mg", price: 11000 },
    { name: "Actifed Cold Tab", price: 1400 },
    { name: "Amloc 5mg", price: 4200 },
    { name: "Ventolin Inhaler", price: 8500 },
    { name: "Amoxil 500mg", price: 3500 },
    { name: "Panadol Extra", price: 800 }
  ];

  const getPastDate = (daysAgo: number): { dateString: string; displayTime: string } => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    
    const hours = String(Math.floor(Math.random() * 8) + 9).padStart(2, "0");
    const mins = String(Math.floor(Math.random() * 60)).padStart(2, "0");
    const secs = String(Math.floor(Math.random() * 60)).padStart(2, "0");

    return {
      dateString: `${year}-${month}-${day}`,
      displayTime: `${hours}:${mins}:${secs} ${month}/${day}/${year}`
    };
  };

  const mockUserPool = [
    { id: "user-super", username: "superadmin" },
    { id: "user-admin", username: "admin" },
    { id: "user-cashier", username: "cashier" }
  ];

  // Generate 3 sales for today
  for (let i = 0; i < 3; i++) {
    const { dateString, displayTime } = getPastDate(0);
    const item1 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    const item2 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    const q1 = Math.floor(Math.random() * 3) + 1;
    const q2 = Math.floor(Math.random() * 2) + 1;
    const total = (item1.price * q1) + (item2.price * q2);
    const u = mockUserPool[Math.floor(Math.random() * mockUserPool.length)];
    
    records.push({
      id: `TX-${100000 + Math.floor(Math.random() * 900000)}`,
      timestamp: displayTime,
      date: dateString,
      items: [
        { productName: item1.name, quantity: q1, price: item1.price },
        { productName: item2.name, quantity: q2, price: item2.price }
      ],
      total,
      cashPaid: Math.floor(total * 0.4),
      transferPaid: Math.floor(total * 0.4),
      cardPaid: total - Math.floor(total * 0.4) - Math.floor(total * 0.4),
      pharmacyId: "gpharm-lagos-hq",
      userId: u.id,
      userName: u.username
    });
  }

  // Generate 4 sales for yesterday
  for (let i = 0; i < 4; i++) {
    const { dateString, displayTime } = getPastDate(1);
    const item1 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    const q1 = Math.floor(Math.random() * 4) + 1;
    const total = item1.price * q1;
    const u = mockUserPool[Math.floor(Math.random() * mockUserPool.length)];
    
    records.push({
      id: `TX-${100000 + Math.floor(Math.random() * 900000)}`,
      timestamp: displayTime,
      date: dateString,
      items: [{ productName: item1.name, quantity: q1, price: item1.price }],
      total,
      cashPaid: total,
      transferPaid: 0,
      cardPaid: 0,
      pharmacyId: "gpharm-lagos-hq",
      userId: u.id,
      userName: u.username
    });
  }

  // Generate 12 sales for the past week (2 to 7 days ago)
  for (let i = 2; i <= 7; i++) {
    const numSales = Math.floor(Math.random() * 2) + 1;
    for (let s = 0; s < numSales; s++) {
      const { dateString, displayTime } = getPastDate(i);
      const item1 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
      const q1 = Math.floor(Math.random() * 2) + 1;
      const total = item1.price * q1;
      const u = mockUserPool[Math.floor(Math.random() * mockUserPool.length)];
      
      records.push({
        id: `TX-${100000 + Math.floor(Math.random() * 900000)}`,
        timestamp: displayTime,
        date: dateString,
        items: [{ productName: item1.name, quantity: q1, price: item1.price }],
        total,
        cashPaid: 0,
        transferPaid: total,
        cardPaid: 0,
        pharmacyId: "gpharm-lagos-hq",
        userId: u.id,
        userName: u.username
      });
    }
  }

  // Generate 15 sales for past month (8 to 30 days ago)
  for (let i = 8; i <= 30; i += 3) {
    const numSales = Math.floor(Math.random() * 2) + 1;
    for (let s = 0; s < numSales; s++) {
      const { dateString, displayTime } = getPastDate(i);
      const item1 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
      const q1 = Math.floor(Math.random() * 3) + 1;
      const total = item1.price * q1;
      const u = mockUserPool[Math.floor(Math.random() * mockUserPool.length)];
      
      records.push({
        id: `TX-${100000 + Math.floor(Math.random() * 900000)}`,
        timestamp: displayTime,
        date: dateString,
        items: [{ productName: item1.name, quantity: q1, price: item1.price }],
        total,
        cashPaid: 0,
        transferPaid: 0,
        cardPaid: total,
        pharmacyId: "gpharm-lagos-hq",
        userId: u.id,
        userName: u.username
      });
    }
  }

  // Generate 30 sales for earlier this year (31 to 180 days ago)
  for (let i = 31; i <= 180; i += 6) {
    const { dateString, displayTime } = getPastDate(i);
    const item1 = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    const q1 = Math.floor(Math.random() * 2) + 1;
    const total = item1.price * q1;
    const u = mockUserPool[Math.floor(Math.random() * mockUserPool.length)];
    
    records.push({
      id: `TX-${100000 + Math.floor(Math.random() * 900000)}`,
      timestamp: displayTime,
      date: dateString,
      items: [{ productName: item1.name, quantity: q1, price: item1.price }],
      total,
      cashPaid: Math.floor(total * 0.5),
      transferPaid: 0,
      cardPaid: total - Math.floor(total * 0.5),
      pharmacyId: "gpharm-lagos-hq",
      userId: u.id,
      userName: u.username
    });
  }

  return records;
};

export default function App() {
  // --- Multi-Tenant States ---
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => {
    const saved = localStorage.getItem("pocket_pharmacies");
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_PHARMACIES; }
    } else {
      localStorage.setItem("pocket_pharmacies", JSON.stringify(DEFAULT_PHARMACIES));
      return DEFAULT_PHARMACIES;
    }
  });

  const [appUsers, setAppUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem("pocket_app_users");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppUser[];
        const migrated = parsed.map(u => {
          if (u.username === "cashier" && (u.pinCode === "1234" || u.pinCode.length < 6)) return { ...u, pinCode: "Cash1$" };
          if (u.username === "admin" && (u.pinCode === "4321" || u.pinCode.length < 6)) return { ...u, pinCode: "Admin1#" };
          if (u.username === "superadmin" && (u.pinCode === "1245" || u.pinCode.length < 6)) return { ...u, pinCode: "Super1@" };
          return u;
        });
        localStorage.setItem("pocket_app_users", JSON.stringify(migrated));
        return migrated;
      } catch { return DEFAULT_USERS; }
    } else {
      localStorage.setItem("pocket_app_users", JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("pocket_current_user");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(() => {
    const saved = localStorage.getItem("pocket_current_pharmacy");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  // --- Registration / Onboarding Form States ---
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regPharmacyName, setRegPharmacyName] = useState<string>("");
  const [regPromoterName, setRegPromoterName] = useState<string>("");
  const [regLocation, setRegLocation] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regPin, setRegPin] = useState<string>("");

  // --- Login Screen States ---
  const [loginUsername, setLoginUsername] = useState<string>("");

  // --- Staff Management Form States ---
  const [newUserUsername, setNewUserUsername] = useState<string>("");
  const [newUserPin, setNewUserPin] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<"cashier" | "admin" | "super_admin">("cashier");
  const [newUserLocation, setNewUserLocation] = useState<string>("");
  const [newUserFeatures, setNewUserFeatures] = useState<string[]>(["sales"]);

  // --- Pharmacy Edit States ---
  const [isEditingPharmacy, setIsEditingPharmacy] = useState<boolean>(false);
  const [editPharmName, setEditPharmName] = useState<string>("");
  const [editPharmDirector, setEditPharmDirector] = useState<string>("");
  const [editPharmLocation, setEditPharmLocation] = useState<string>("");
  const [editPharmPhone, setEditPharmPhone] = useState<string>("");
  const [editPharmEmail, setEditPharmEmail] = useState<string>("");

  // --- Current Operating Role ---
  const [currentRole, setCurrentRole] = useState<"cashier" | "admin" | "super_admin">(() => {
    return (localStorage.getItem("gpharm_role") as "cashier" | "admin" | "super_admin") || "cashier";
  });

  // --- Core Application States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");

  // --- Sales Records States ---
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => {
    const saved = localStorage.getItem("pocket_sales_records");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return generateMockSales();
      }
    } else {
      const mockSales = generateMockSales();
      localStorage.setItem("pocket_sales_records", JSON.stringify(mockSales));
      return mockSales;
    }
  });

  // --- Stock Taking States ---
  const [stockAuditHistory, setStockAuditHistory] = useState<StockAuditEntry[]>(() => {
    const saved = localStorage.getItem("pocket_stock_audit_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    } else {
      const defaultAudits: StockAuditEntry[] = [
        {
          id: "ST-1",
          date: new Date().toISOString().split('T')[0],
          productName: "Amoxil 500mg",
          appCount: 20,
          shelfCount: 24,
          discrepancy: 4,
          reason: "Found unrecorded carton in back shelf during physical count",
          timestamp: "09:00:00 AM 07/05/2026",
          pharmacyId: "gpharm-lagos-hq"
        },
        {
          id: "ST-2",
          date: new Date().toISOString().split('T')[0],
          productName: "Augmentin 625mg",
          appCount: 10,
          shelfCount: 8,
          discrepancy: -2,
          reason: "Damaged box discarded, not yet written off",
          timestamp: "09:15:00 AM 07/05/2026",
          pharmacyId: "gpharm-lagos-hq"
        }
      ];
      localStorage.setItem("pocket_stock_audit_history", JSON.stringify(defaultAudits));
      return defaultAudits;
    }
  });

  const [stockTakingFrequencies, setStockTakingFrequencies] = useState<StockFrequency[]>(() => {
    const saved = localStorage.getItem("pocket_stock_frequencies");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    } else {
      const defaultFreqs: StockFrequency[] = [
        { id: "SF-1", frequency: "Weekly", targetDayOrDate: "Monday", timeOfDay: "08:00 AM", notes: "Weekly routine morning stock audit", pharmacyId: "gpharm-lagos-hq" },
        { id: "SF-2", frequency: "Monthly", targetDayOrDate: "1st day of month", timeOfDay: "06:00 PM", notes: "End of month clinical reconciliation", pharmacyId: "gpharm-lagos-hq" }
      ];
      localStorage.setItem("pocket_stock_frequencies", JSON.stringify(defaultFreqs));
      return defaultFreqs;
    }
  });

  // --- Authentication States ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("gpharm_is_logged_in") === "true";
  });
  const [pinCode, setPinCode] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // --- Restore session if needed ---
  useEffect(() => {
    if (isLoggedIn && (!currentUser || !currentPharmacy)) {
      const defaultUser = appUsers.find(u => u.role === currentRole && u.pharmacyId === "gpharm-lagos-hq") || appUsers[0];
      const defaultPharm = pharmacies.find(p => p.id === (defaultUser?.pharmacyId || "gpharm-lagos-hq")) || pharmacies[0];
      setCurrentUser(defaultUser);
      setCurrentPharmacy(defaultPharm);
      localStorage.setItem("pocket_current_user", JSON.stringify(defaultUser));
      localStorage.setItem("pocket_current_pharmacy", JSON.stringify(defaultPharm));
    }
  }, [isLoggedIn, currentRole, appUsers, pharmacies, currentUser, currentPharmacy]);

  // Sync staff location & edit form state with current pharmacy headquarter
  useEffect(() => {
    if (currentPharmacy) {
      setNewUserLocation(currentPharmacy.location);
      setEditPharmName(currentPharmacy.name || "");
      setEditPharmDirector(currentPharmacy.directorName || "");
      setEditPharmLocation(currentPharmacy.location || "");
      setEditPharmPhone(currentPharmacy.phone || "");
      setEditPharmEmail(currentPharmacy.email || "");
    }
  }, [currentPharmacy]);

  // --- Active Pharmacy Memos for Multi-Tenant Data Isolation ---
  const activePharmacyProducts = useMemo(() => {
    if (!currentPharmacy) return [];
    return products.filter(p => (p.pharmacyId || "gpharm-lagos-hq") === currentPharmacy.id);
  }, [products, currentPharmacy]);

  const activePharmacySales = useMemo(() => {
    if (!currentPharmacy) return [];
    return salesRecords.filter(r => (r.pharmacyId || "gpharm-lagos-hq") === currentPharmacy.id);
  }, [salesRecords, currentPharmacy]);

  const activePharmacyAudits = useMemo(() => {
    if (!currentPharmacy) return [];
    return stockAuditHistory.filter(a => (a.pharmacyId || "gpharm-lagos-hq") === currentPharmacy.id);
  }, [stockAuditHistory, currentPharmacy]);

  const activePharmacyFrequencies = useMemo(() => {
    if (!currentPharmacy) return [];
    return stockTakingFrequencies.filter(f => (f.pharmacyId || "gpharm-lagos-hq") === currentPharmacy.id);
  }, [stockTakingFrequencies, currentPharmacy]);

  const activePharmacyUsers = useMemo(() => {
    if (!currentPharmacy) return [];
    return appUsers.filter(u => (u.pharmacyId || "gpharm-lagos-hq") === currentPharmacy.id);
  }, [appUsers, currentPharmacy]);

  const [shelfCounts, setShelfCounts] = useState<{[key: string]: string}>({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState<{[key: string]: string}>({});
  const [auditDate, setAuditDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Schedule Form states
  const [newFreq, setNewFreq] = useState<"Daily" | "Weekly" | "Bi-weekly" | "Monthly">("Weekly");
  const [newFreqTarget, setNewFreqTarget] = useState<string>("Monday");
  const [newFreqTime, setNewFreqTime] = useState<string>("08:00 AM");
  const [newFreqNotes, setNewFreqNotes] = useState<string>("");

  // Schedule Form Notification states
  const [newFreqAppNotification, setNewFreqAppNotification] = useState<boolean>(true);
  const [newFreqEmailNotification, setNewFreqEmailNotification] = useState<boolean>(true);
  const [newFreqEmailAddress, setNewFreqEmailAddress] = useState<string>("onyemekamichael@gmail.com");

  // Stock Auditor Search state
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");

  // Master Inventory Manager Search state (Default view shows top 3 in-stock + 2 lost/out-of-stock medicines)
  const [masterInventorySearchQuery, setMasterInventorySearchQuery] = useState<string>("");
  const [showAllInventory, setShowAllInventory] = useState<boolean>(false);

  // Filtered inventory products logic for Section 4 (Top 3 medicines + 2 lost medicines default display)
  const filteredInventoryProducts = useMemo(() => {
    const q = masterInventorySearchQuery.trim().toLowerCase();

    // 1. When a search query is active, return all matching items from pharmacy inventory
    if (q !== "") {
      return activePharmacyProducts.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.api_molecule && p.api_molecule.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          (p.drug_type && p.drug_type.toLowerCase().includes(q))
        );
      });
    }

    // 2. When 'Show Full List' is manually toggled on, show all pharmacy products
    if (showAllInventory) {
      return activePharmacyProducts;
    }

    // 3. DEFAULT PREVIEW MODE: Top 3 available medicines + 2 lost / out-of-stock medicines
    const inStock = activePharmacyProducts.filter((p) => p.quantity > 0);
    const lostOrLowStock = activePharmacyProducts.filter((p) => p.quantity <= 0);

    const top3InStock = inStock.slice(0, 3);
    
    // Pick 2 lost / out-of-stock items, or if fewer than 2, pick lowest quantity items remaining
    let top2Lost = lostOrLowStock.slice(0, 2);
    if (top2Lost.length < 2) {
      const top3Ids = new Set(top3InStock.map((p) => p.id));
      const remainingByLowQty = [...activePharmacyProducts]
        .filter((p) => !top3Ids.has(p.id))
        .sort((a, b) => a.quantity - b.quantity);
      
      const needed = 2 - top2Lost.length;
      top2Lost = [...top2Lost, ...remainingByLowQty.slice(0, needed)];
    }

    return [...top3InStock, ...top2Lost];
  }, [activePharmacyProducts, masterInventorySearchQuery, showAllInventory]);

  // Calculate total inventory metrics (Total Products, Total Units, Total Cost Value, Total Sales Value, Profit Margin)
  const inventoryMetrics = useMemo(() => {
    const totalProductsCount = activePharmacyProducts.length;
    const totalUnitsCount = activePharmacyProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
    
    const totalCostValue = activePharmacyProducts.reduce((sum, p) => {
      const unitCost = p.cost_price !== undefined && p.cost_price !== null && !isNaN(p.cost_price)
        ? p.cost_price
        : Math.round((p.price || 0) * 0.7);
      return sum + (unitCost * (p.quantity || 0));
    }, 0);

    const totalSalesValue = activePharmacyProducts.reduce((sum, p) => {
      return sum + ((p.price || 0) * (p.quantity || 0));
    }, 0);

    const totalPotentialProfit = totalSalesValue - totalCostValue;

    return {
      totalProductsCount,
      totalUnitsCount,
      totalCostValue,
      totalSalesValue,
      totalPotentialProfit
    };
  }, [activePharmacyProducts]);

  // Simulated Reminder Logs State
  const [reminderLogs, setReminderLogs] = useState<{
    id: string;
    timestamp: string;
    scheduleId: string;
    scheduleDetails: string;
    type: "app" | "email";
    message: string;
    recipient?: string;
  }[]>(() => {
    const saved = localStorage.getItem("pocket_audit_reminder_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sub-tab for scheduler logs
  const [freqSubTab, setFreqSubTab] = useState<"history" | "reminders">("history");

  // Receipt & SMS States
  const [smsPhoneNumber, setSmsPhoneNumber] = useState<string>("");
  const [requestSmsReceipt, setRequestSmsReceipt] = useState<boolean>(false);
  const [smsSentStatus, setSmsSentStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [smsPreviewText, setSmsPreviewText] = useState<string>("");

  // Super Admin Navigation Tab
  const [superAdminTab, setSuperAdminTab] = useState<"sales" | "stocktake" | "frequencies" | "staff" | "pharmacy_profile">("sales");

  // User filter state for Sales Journal
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");

  // --- Split Payment Inputs ---
  const [paymentCash, setPaymentCash] = useState<string>("");
  const [paymentTransfer, setPaymentTransfer] = useState<string>("");
  const [paymentCard, setPaymentCard] = useState<string>("");

  // Clinical Alert Tab state
  const [activeAlertTab, setActiveAlertTab] = useState<"low" | "expiry">("low");

  // --- Modals State ---
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<{
    cart: CartItem[];
    total: number;
    cashPaid: number;
    transferPaid: number;
    cardPaid: number;
    change: number;
    timestamp: string;
    receiptId: string;
  } | null>(null);

  // --- Drug & API System Knowledge Base ---
  const [drugApiKnowledge, setDrugApiKnowledge] = useState<DrugApiMapping[]>(() => {
    const saved = localStorage.getItem("pocket_drug_api_knowledge");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_DRUG_API_KNOWLEDGE;
  });

  // --- Manual Product Form ---
  const [manualForm, setManualForm] = useState({
    name: "",
    api_molecule: "",
    category: "Antibiotics",
    price: "",
    cost_price: "",
    quantity: "",
    pom: false,
    low_stock_threshold: "10",
    expiry_month: "12",
    expiry_year: "2027",
    drug_type: "Tablet"
  });

  // Search matching drug API suggestion based on entered name
  const suggestedApiForInput = useMemo(() => {
    if (!manualForm.name || manualForm.name.trim().length < 2) return "";
    const query = manualForm.name.trim().toLowerCase();
    
    // Check drugApiKnowledge
    const matchInKnowledge = drugApiKnowledge.find(k => k.name.toLowerCase().includes(query) && k.api);
    if (matchInKnowledge) return matchInKnowledge.api;

    // Fallback check existing products list
    const matchInProducts = activePharmacyProducts.find(p => p.name.toLowerCase().includes(query) && p.api_molecule);
    if (matchInProducts) return matchInProducts.api_molecule;

    return "";
  }, [manualForm.name, drugApiKnowledge, activePharmacyProducts]);

  // Related Drugs and APIs for selected category
  const categoryRelatedList = useMemo(() => {
    const cat = manualForm.category;
    const list: DrugApiMapping[] = [];
    const seenNames = new Set<string>();

    drugApiKnowledge.forEach(k => {
      if (k.category === cat && !seenNames.has(k.name.toLowerCase())) {
        seenNames.add(k.name.toLowerCase());
        list.push(k);
      }
    });

    activePharmacyProducts.forEach(p => {
      if (p.category === cat && !seenNames.has(p.name.toLowerCase())) {
        seenNames.add(p.name.toLowerCase());
        list.push({ name: p.name, api: p.api_molecule || "", category: p.category });
      }
    });

    return list;
  }, [manualForm.category, drugApiKnowledge, activePharmacyProducts]);

  // --- Gemini Staff AI Consult States ---
  const [consultingProduct, setConsultingProduct] = useState<Product | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>("");

  // --- Database Sync State ---
  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "local_fallback">("connecting");
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Keep a mutable reference to current products list to prevent closure capture issues in async sync
  const productsRef = useRef<Product[]>([]);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Ref for database listener
  const supabaseRef = useRef<any>(null);

  // Add db logs helper
  const addLog = (msg: string) => {
    setDbLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Create Supabase Client carefully
  const supabase = useMemo(() => {
    try {
      return createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.warn("Supabase Init Error", e);
      return null;
    }
  }, []);

  // Handle local state when Supabase fails or doesn't have table
  const loadLocalProducts = () => {
    const saved = localStorage.getItem("gpharm_local_products");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch {
        setProducts(DEFAULT_PRODUCTS);
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem("gpharm_local_products", JSON.stringify(DEFAULT_PRODUCTS));
    }
  };

  // --- Two-Way Offline & Online Synchronization Engine (Multi-Tenant Isolated) ---
  const performTwoWaySync = async () => {
    if (!currentPharmacy) return;
    const targetPharmId = currentPharmacy.id;

    if (!supabase) {
      setDbStatus("local_fallback");
      loadLocalProducts();
      return;
    }

    // Don't attempt to sync if browser explicitly reports being offline
    if (!navigator.onLine) {
      setDbStatus("local_fallback");
      loadLocalProducts();
      addLog("Device is offline. Running with saved local information.");
      return;
    }

    try {
      setDbStatus("connecting");
      addLog(`Synchronizing inventory for workspace "${currentPharmacy.name}"...`);

      // 1. Fetch remote products for ONLY this active pharmacy
      const { data: remoteProducts, error } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .eq("pharmacyId", targetPharmId)
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      // Get latest local products for this pharmacy using the ref
      let localProducts = [...productsRef.current].filter(p => (p.pharmacyId || "gpharm-lagos-hq") === targetPharmId);
      if (localProducts.length === 0) {
        const saved = localStorage.getItem("gpharm_local_products");
        if (saved) {
          try {
            const parsed: Product[] = JSON.parse(saved);
            localProducts = parsed.filter(p => (p.pharmacyId || "gpharm-lagos-hq") === targetPharmId);
          } catch {}
        }
      }

      // If remote database is empty for this pharmacy workspace, seed it with this pharmacy's local items
      if (!remoteProducts || remoteProducts.length === 0) {
        const seedSource = localProducts.length > 0 ? localProducts : DEFAULT_PRODUCTS.map(p => ({ ...p, pharmacyId: targetPharmId }));
        const seedWithPharm = seedSource.map(p => ({ ...p, pharmacyId: targetPharmId }));
        const { error: seedError } = await supabase
          .from("pharmacy_inventory")
          .insert(seedWithPharm);
        
        if (seedError) {
          console.warn("Cloud seed notice:", seedError);
        } else {
          addLog(`Seeded Cloud workspace for "${currentPharmacy.name}" successfully!`);
        }
        setDbStatus("connected");
        return;
      }

      // Retrieve deleted IDs to process offline deletions
      let deletedIds: string[] = [];
      const savedDeleted = localStorage.getItem("pocket_deleted_product_ids");
      if (savedDeleted) {
        try { deletedIds = JSON.parse(savedDeleted); } catch {}
      }

      // 2. Process Deletions on Remote for this pharmacy space
      if (deletedIds.length > 0) {
        addLog(`Syncing offline deletions (${deletedIds.length} items)...`);
        for (const delId of deletedIds) {
          try {
            await supabase.from("pharmacy_inventory").delete().eq("id", delId).eq("pharmacyId", targetPharmId);
          } catch (e) {
            console.warn(`Failed to delete product ${delId} on remote:`, e);
          }
        }
        localStorage.removeItem("pocket_deleted_product_ids");
      }

      // 3. Build lookup maps
      const remoteMap = new Map<string, Product>();
      remoteProducts.forEach(p => remoteMap.set(p.id, p));

      const localMap = new Map<string, Product>();
      localProducts.forEach(p => localMap.set(p.id, p));

      const itemsToUpsert: Product[] = [];
      const mergedProducts: Product[] = [];

      // A. Scan local products to see if they need to be upserted to remote
      localProducts.forEach(localProd => {
        if (deletedIds.includes(localProd.id)) return;

        const remoteProd = remoteMap.get(localProd.id);
        if (!remoteProd) {
          const tagged = { ...localProd, pharmacyId: targetPharmId };
          itemsToUpsert.push(tagged);
          mergedProducts.push(tagged);
        } else {
          if (localProd.quantity !== remoteProd.quantity || 
              localProd.price !== remoteProd.price || 
              localProd.name !== remoteProd.name ||
              localProd.api_molecule !== remoteProd.api_molecule) {
            const tagged = { ...localProd, pharmacyId: targetPharmId };
            itemsToUpsert.push(tagged);
            mergedProducts.push(tagged);
          } else {
            mergedProducts.push(remoteProd);
          }
        }
      });

      // B. Scan remote products to pull items added/modified by other users of THIS pharmacy
      remoteProducts.forEach(remoteProd => {
        if (deletedIds.includes(remoteProd.id)) return;
        
        if (!localMap.has(remoteProd.id)) {
          mergedProducts.push(remoteProd);
        }
      });

      // 4. Perform batch upsert to Supabase
      if (itemsToUpsert.length > 0) {
        addLog(`Pushing ${itemsToUpsert.length} modifications for ${currentPharmacy.name} to Cloud...`);
        const { error: upsertError } = await supabase
          .from("pharmacy_inventory")
          .upsert(itemsToUpsert);

        if (upsertError) {
          console.warn("Sync Upsert Warning:", upsertError);
          addLog(`Sync Warning: ${upsertError.message}`);
        } else {
          addLog(`Pushed ${itemsToUpsert.length} records successfully.`);
        }
      }

      // 5. Update local state keeping other pharmacies' products intact in storage
      const otherPharmaciesProducts = productsRef.current.filter(p => (p.pharmacyId || "gpharm-lagos-hq") !== targetPharmId);
      const allProductsUpdated = [...otherPharmaciesProducts, ...mergedProducts].sort((a, b) => a.name.localeCompare(b.name));

      setProducts(allProductsUpdated);
      localStorage.setItem("gpharm_local_products", JSON.stringify(allProductsUpdated));

      setDbStatus("connected");
      addLog(`Synchronization complete for workspace: ${currentPharmacy.name}`);
      addLog("Synchronization complete! All terminal users synced.");

    } catch (err: any) {
      console.warn("Sync error:", err);
      setDbStatus("local_fallback");
      loadLocalProducts();
      addLog("Database offline. Running with saved local information.");
    }
  };

  // --- 1. Load Data & Sync Setup on Startup ---
  useEffect(() => {
    // Initial sync
    performTwoWaySync();

    // Set up realtime connection if possible
    if (supabase) {
      try {
        supabaseRef.current = supabase
          .channel("supabase-realtime-changes")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pharmacy_inventory" },
            (payload) => {
              addLog(`Realtime event: ${payload.eventType} detected on cloud.`);
              handleRealtimeEvent(payload);
            }
          )
          .subscribe((status) => {
            addLog(`Realtime subscription status: ${status}`);
          });
      } catch (err) {
        console.warn("Realtime Subscription Error", err);
      }
    }

    // Monitor browser connection changes
    const handleOnline = () => {
      setIsOnline(true);
      addLog("Device is back online! Re-enabling database sync...");
      performTwoWaySync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDbStatus("local_fallback");
      addLog("Device is offline. Running with saved local information.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set up regular background polling sync (every 30 seconds)
    const syncInterval = setInterval(() => {
      if (navigator.onLine && supabase) {
        performTwoWaySync();
      }
    }, 30000);

    return () => {
      if (supabaseRef.current) {
        try {
          supabaseRef.current.unsubscribe();
        } catch {}
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, [supabase]);

  // Update products in active memory and sync with storage or remote
  const saveProductsList = async (updatedList: Product[]) => {
    setProducts(updatedList);
    localStorage.setItem("gpharm_local_products", JSON.stringify(updatedList));

    if (dbStatus === "connected" && supabase) {
      addLog("Pushing bulk changes to Cloud sync...");
    }
  };

  // Live PostgreSQL event dispatcher
  const handleRealtimeEvent = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    setProducts((currentList) => {
      let updated = [...currentList];
      if (eventType === "INSERT") {
        if (!updated.some(p => p.id === newRecord.id)) {
          updated.push(newRecord);
        }
      } else if (eventType === "UPDATE") {
        updated = updated.map(p => p.id === newRecord.id ? { ...p, ...newRecord } : p);
      } else if (eventType === "DELETE") {
        updated = updated.filter(p => p.id !== oldRecord.id);
      }
      localStorage.setItem("gpharm_local_products", JSON.stringify(updated));
      return updated;
    });
  };

  // Re-establish cloud sync manually
  const triggerManualSync = async () => {
    addLog("Manual synchronization requested...");
    await performTwoWaySync();
  };

  // --- 2. Security Gate Controls ---
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pinCode.trim();

    if (!cleanPin) {
      setPinError("❌ Please enter your password.");
      return;
    }

    const resolvedUsername = loginUsername.trim().toLowerCase();
    
    // Support login matching username and password
    const foundUser = appUsers.find(u => u.username === resolvedUsername && u.pinCode === cleanPin);
    if (foundUser) {
      const foundPharm = pharmacies.find(p => p.id === foundUser.pharmacyId) || pharmacies[0];
      setCurrentUser(foundUser);
      setCurrentPharmacy(foundPharm);
      setIsLoggedIn(true);
      setCurrentRole(foundUser.role);
      localStorage.setItem("gpharm_is_logged_in", "true");
      localStorage.setItem("gpharm_role", foundUser.role);
      localStorage.setItem("pocket_current_user", JSON.stringify(foundUser));
      localStorage.setItem("pocket_current_pharmacy", JSON.stringify(foundPharm));
      setPinCode("");
      setPinError("");
      addLog(`Access Granted. Welcome back, ${foundUser.username} (${foundUser.role.toUpperCase()})!`);
    } else {
      setPinError("❌ ACCESS DENIED: Invalid Username or Password.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPharmacy(null);
    localStorage.removeItem("gpharm_is_logged_in");
    localStorage.removeItem("gpharm_role");
    localStorage.removeItem("pocket_current_user");
    localStorage.removeItem("pocket_current_pharmacy");
    setLoginUsername("");
    setPinCode("");
    setPinError("");
    addLog("Logged out. Security terminal locked.");
  };

  const handleRegisterPharmacy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPharmacyName.trim() || !regPromoterName.trim() || !regLocation.trim() || !regPhone.trim() || !regEmail.trim() || !regUsername.trim() || !regPin.trim()) {
      alert("⚠️ Please fill all fields to onboard your pharmacy.");
      return;
    }
    
    const passCheck = validatePassword(regPin);
    if (!passCheck.valid) {
      alert(`⚠️ ${passCheck.message}`);
      return;
    }

    const pharmacyId = `pharm-${Date.now()}`;
    const newPharmacy: Pharmacy = {
      id: pharmacyId,
      name: regPharmacyName.trim(),
      directorName: regPromoterName.trim(),
      location: regLocation.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim()
    };

    const userId = `user-${Date.now()}`;
    const newSuperAdmin: AppUser = {
      id: userId,
      pharmacyId,
      username: regUsername.trim().toLowerCase(),
      pinCode: regPin.trim(),
      role: "super_admin",
      location: regLocation.trim(),
      features: ["sales", "inventory", "audits", "ai_consult", "admin_panel"]
    };

    const updatedPharmacies = [...pharmacies, newPharmacy];
    const updatedUsers = [...appUsers, newSuperAdmin];

    setPharmacies(updatedPharmacies);
    setAppUsers(updatedUsers);

    localStorage.setItem("pocket_pharmacies", JSON.stringify(updatedPharmacies));
    localStorage.setItem("pocket_app_users", JSON.stringify(updatedUsers));

    // Seed products specifically for this pharmacy!
    const seededProducts = DEFAULT_PRODUCTS.map(p => ({
      ...p,
      id: `p-${pharmacyId}-${p.id}`,
      pharmacyId
    }));
    const updatedProducts = [...products, ...seededProducts];
    saveProductsList(updatedProducts);

    // Auto log in!
    setCurrentUser(newSuperAdmin);
    setCurrentPharmacy(newPharmacy);
    setIsLoggedIn(true);
    setCurrentRole("super_admin");
    localStorage.setItem("gpharm_is_logged_in", "true");
    localStorage.setItem("gpharm_role", "super_admin");
    localStorage.setItem("pocket_current_user", JSON.stringify(newSuperAdmin));
    localStorage.setItem("pocket_current_pharmacy", JSON.stringify(newPharmacy));

    // Clear form
    setRegPharmacyName("");
    setRegPromoterName("");
    setRegLocation("");
    setRegPhone("");
    setRegEmail("");
    setRegUsername("");
    setRegPin("");
    setIsRegistering(false);

    alert(`🎉 Pharmacy "${newPharmacy.name}" onboarded successfully!\nYou have been automatically logged in as Super Admin. Your active username is: ${newSuperAdmin.username}`);
    addLog(`Onboarded new pharmacy space: ${newPharmacy.name}. Director: ${newPharmacy.directorName}`);
  };

  const handleSavePharmacyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPharmacy) return;

    if (!editPharmName.trim()) {
      alert("⚠️ Pharmacy name is required.");
      return;
    }

    const updatedPharm: Pharmacy = {
      ...currentPharmacy,
      name: editPharmName.trim(),
      directorName: editPharmDirector.trim(),
      location: editPharmLocation.trim(),
      phone: editPharmPhone.trim(),
      email: editPharmEmail.trim()
    };

    setCurrentPharmacy(updatedPharm);
    const updatedList = pharmacies.map(p => p.id === updatedPharm.id ? updatedPharm : p);
    setPharmacies(updatedList);
    localStorage.setItem("pocket_pharmacies", JSON.stringify(updatedList));
    localStorage.setItem("pocket_current_pharmacy", JSON.stringify(updatedPharm));

    addLog(`Updated pharmacy workspace profile for "${updatedPharm.name}".`);
    alert(`✅ Pharmacy workspace profile for "${updatedPharm.name}" updated successfully!`);
  };

  const handleAddStaffUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername.trim() || !newUserPin.trim() || !newUserLocation.trim()) {
      alert("⚠️ Please fill all fields to create a staff member.");
      return;
    }
    
    const passCheck = validatePassword(newUserPin);
    if (!passCheck.valid) {
      alert(`⚠️ ${passCheck.message}`);
      return;
    }
    
    if (!currentPharmacy) {
      alert("⚠️ No active pharmacy workspace selected.");
      return;
    }

    const usernameClean = newUserUsername.trim().toLowerCase();

    // Prevent duplicate username across the same pharmacy space
    const isDuplicate = appUsers.some(u => u.username === usernameClean && u.pharmacyId === currentPharmacy.id);
    if (isDuplicate) {
      alert(`⚠️ A user with username "${usernameClean}" already exists in your pharmacy.`);
      return;
    }

    const newStaff: AppUser = {
      id: `user-${Date.now()}`,
      pharmacyId: currentPharmacy.id,
      username: usernameClean,
      pinCode: newUserPin.trim(),
      role: newUserRole,
      location: newUserLocation.trim(),
      features: [...newUserFeatures]
    };

    const updatedUsers = [...appUsers, newStaff];
    setAppUsers(updatedUsers);
    setAppUsers(updatedUsers);
    localStorage.setItem("pocket_app_users", JSON.stringify(updatedUsers));

    // Clear form fields
    setNewUserUsername("");
    setNewUserPin("");
    setNewUserRole("cashier");
    setNewUserFeatures(["sales"]);

    alert(`✅ Staff member "${usernameClean}" created successfully under PIN: ${newStaff.pinCode}`);
    addLog(`Created new staff user: ${usernameClean} as ${newUserRole.toUpperCase()}`);
  };

  const handleDeleteStaffUser = (userId: string) => {
    if (currentUser?.id === userId) {
      alert("⚠️ ACCESS DENIED: You cannot delete your own active root account.");
      return;
    }
    const targetUser = appUsers.find(u => u.id === userId);
    if (!targetUser) return;

    if (confirm(`Are you sure you want to permanently revoke all access and delete user "${targetUser.username}"?`)) {
      const updated = appUsers.filter(u => u.id !== userId);
      setAppUsers(updated);
      localStorage.setItem("pocket_app_users", JSON.stringify(updated));
      alert(`✅ User "${targetUser.username}" has been removed from your pharmacy workspace.`);
      addLog(`Deleted staff user account: ${targetUser.username}`);
    }
  };

  // --- 3. POS Logic ---
  // Calculate product sales count for ranking
  const productSalesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    activePharmacySales.forEach(sale => {
      sale.items.forEach(item => {
        map[item.id] = (map[item.id] || 0) + item.quantity;
      });
    });
    return map;
  }, [activePharmacySales]);

  // Filtering products (limited strictly to top 3 products sorted by sales volume)
  const filteredProducts = useMemo(() => {
    const matched = activePharmacyProducts.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.api_molecule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === "All Categories" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort by sales volume (highest sales first)
    matched.sort((a, b) => {
      const salesA = productSalesCountMap[a.id] || 0;
      const salesB = productSalesCountMap[b.id] || 0;
      return salesB - salesA;
    });

    // Limit visible products on POS to top 3
    return matched.slice(0, 3);
  }, [activePharmacyProducts, searchQuery, selectedCategory, productSalesCountMap]);

  // Dynamic alerts for low stock and expiring medicines (2 months before July 2026 or already expired)
  const clinicalAlerts = useMemo(() => {
    const currentYear = 2026;
    const currentMonth = 7; // July 2026

    const lowStock = activePharmacyProducts.filter(p => {
      const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 10;
      return p.quantity <= threshold;
    });

    const expiring = activePharmacyProducts.filter(p => {
      if (!p.expiry_month || !p.expiry_year) return false;
      const diffMonths = (p.expiry_year - currentYear) * 12 + (p.expiry_month - currentMonth);
      return diffMonths <= 2;
    }).map(p => {
      const diffMonths = (p.expiry_year! - currentYear) * 12 + (p.expiry_month! - currentMonth);
      return {
        product: p,
        diffMonths,
        status: diffMonths < 0 
          ? "Expired" 
          : diffMonths === 0 
            ? "Expires this month" 
            : diffMonths === 1 
              ? "Expires next month" 
              : "Expires in 2 months"
      };
    });

    return { lowStock, expiring };
  }, [activePharmacyProducts]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert(`⚠️ Cannot add "${product.name}" to cart. OUT OF STOCK.`);
      return;
    }
    
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`⚠️ Available stock is limited to ${product.quantity} units.`);
          return prev;
        }
        return prev.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, value: number) => {
    const originalProduct = products.find(p => p.id === productId);
    if (!originalProduct) return;

    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + value);
          if (newQty > originalProduct.quantity) {
            alert(`⚠️ Available stock is limited to ${originalProduct.quantity} units.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentCash("");
    setPaymentTransfer("");
    setPaymentCard("");
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Split payment validation
  const numCash = parseFloat(paymentCash) || 0;
  const numTransfer = parseFloat(paymentTransfer) || 0;
  const numCard = parseFloat(paymentCard) || 0;
  const totalPaid = numCash + numTransfer + numCard;
  const canFinalize = cart.length > 0 && totalPaid >= cartTotal;
  const changeDue = Math.max(0, totalPaid - cartTotal);

  const finalizeSale = async () => {
    if (!canFinalize) return;

    try {
      addLog(`Processing sale. Deducting stock for ${cart.length} items.`);
      
      // Compute updated stocks
      const updatedProducts = products.map((prod) => {
        const cartItem = cart.find((item) => item.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            quantity: Math.max(0, prod.quantity - cartItem.quantity)
          };
        }
        return prod;
      });

      // Update locally first
      await saveProductsList(updatedProducts);

      // Try syncing individual updates to Supabase
      if (dbStatus === "connected" && supabase) {
        try {
          for (const item of cart) {
            const newQuantity = Math.max(0, item.product.quantity - item.quantity);
            const { error } = await supabase
              .from("pharmacy_inventory")
              .update({ quantity: newQuantity })
              .eq("id", item.product.id);
            
            if (error) {
              console.error("Cloud stock update error", error);
            }
          }
          addLog("Cloud stock successfully updated.");
        } catch (err) {
          addLog("Offline mode: stock update stored locally. Sync pending.");
        }
      }

      // Record standard receipt details
      const receiptId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString();
      
      const newRecord: SalesRecord = {
        id: receiptId,
        timestamp,
        date: new Date().toISOString().split('T')[0],
        items: cart.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        total: cartTotal,
        cashPaid: numCash,
        transferPaid: numTransfer,
        cardPaid: numCard,
        pharmacyId: currentPharmacy?.id || "gpharm-lagos-hq",
        userId: currentUser?.id || "user-cashier",
        userName: currentUser?.username || "cashier"
      };

      setSalesRecords(prev => {
        const updated = [newRecord, ...prev];
        localStorage.setItem("pocket_sales_records", JSON.stringify(updated));
        return updated;
      });

      // Construct SMS text preview
      const itemsListText = cart.map(item => `${item.product.name} (x${item.quantity})`).join(", ");
      const smsText = `Pocket Pharmacy Receipt [${receiptId}]\nDate: ${timestamp}\nItems: ${itemsListText}\nTotal: ₦${cartTotal.toLocaleString("en-NG")}\nPaid via: Cash(₦${numCash.toLocaleString()}), Transfer(₦${numTransfer.toLocaleString()}), Card(₦${numCard.toLocaleString()})\nChange: ₦${changeDue.toLocaleString()}\nThank you for your clinical purchase!`;
      setSmsPreviewText(smsText);

      setLastReceipt({
        cart: [...cart],
        total: cartTotal,
        cashPaid: numCash,
        transferPaid: numTransfer,
        cardPaid: numCard,
        change: changeDue,
        timestamp,
        receiptId
      });

      setIsReceiptModalOpen(true);
      clearCart();
      alert("✅ TRANSACTION SUCCESSFUL");

    } catch (e: any) {
      console.error(e);
      alert("❌ An error occurred while finalizing the sale.");
    }
  };

  // --- 4. Manual Product Adder ---
  const handleManualFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(manualForm.price);
    const parsedCost = parseFloat(manualForm.cost_price);
    const costPrice = !isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : Math.round(price * 0.7);
    const quantity = parseInt(manualForm.quantity);
    const threshold = parseInt(manualForm.low_stock_threshold) || 10;
    const expMonth = parseInt(manualForm.expiry_month) || 12;
    const expYear = parseInt(manualForm.expiry_year) || 2027;
    const drugType = manualForm.drug_type || "Tablet";

    if (!manualForm.name || isNaN(price) || isNaN(quantity)) {
      alert("⚠️ Please enter valid values for all required fields.");
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: manualForm.name.trim(),
      api_molecule: (manualForm.api_molecule || "").trim(),
      category: manualForm.category,
      price: price,
      cost_price: costPrice,
      quantity: quantity,
      pom: manualForm.pom,
      low_stock_threshold: threshold,
      expiry_month: expMonth,
      expiry_year: expYear,
      drug_type: drugType,
      pharmacyId: currentPharmacy?.id || "gpharm-lagos-hq"
    };

    // Store learned drug & API pair into system knowledge base
    if (newProduct.name && newProduct.api_molecule) {
      const nameTrim = newProduct.name;
      const apiTrim = newProduct.api_molecule;
      const exists = drugApiKnowledge.some(
        k => k.name.toLowerCase() === nameTrim.toLowerCase() && k.api.toLowerCase() === apiTrim.toLowerCase()
      );
      if (!exists) {
        const updatedKnowledge = [{ name: nameTrim, api: apiTrim, category: manualForm.category }, ...drugApiKnowledge];
        setDrugApiKnowledge(updatedKnowledge);
        localStorage.setItem("pocket_drug_api_knowledge", JSON.stringify(updatedKnowledge));
      }
    }

    try {
      addLog(`Adding product: ${newProduct.name}`);
      let updatedList = [newProduct, ...products];

      if (dbStatus === "connected" && supabase) {
        const { data, error } = await supabase
          .from("pharmacy_inventory")
          .insert([newProduct])
          .select();
        
        if (error) {
          addLog(`Supabase insert error: ${error.message}. Saved locally.`);
        } else if (data) {
          updatedList = [data[0], ...products];
          addLog("Product uploaded and synced with Supabase!");
        }
      }

      await saveProductsList(updatedList);
      setIsAddProductModalOpen(false);
      setManualForm({
        name: "",
        api_molecule: "",
        category: "Antibiotics",
        price: "",
        cost_price: "",
        quantity: "",
        pom: false,
        low_stock_threshold: "10",
        expiry_month: "12",
        expiry_year: "2027",
        drug_type: "Tablet"
      });
      alert(`✅ Product "${newProduct.name}" added successfully.`);

    } catch (err) {
      console.error(err);
      alert("Saved locally. Unable to connect to Supabase.");
    }
  };

  // --- 5. Bulk XLSX Importer ---
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`Parsing Excel file: ${file.name}`);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws) as any[];

        addLog(`Importing ${rawRows.length} entries from Sheet...`);
        const parsedProducts: Product[] = [];

        rawRows.forEach((row, idx) => {
          // Normalize header matching: Name, API, Category, Price, Quantity, POM, Low Stock Threshold, Expiry Month, Expiry Year, Drug Type
          const name = row.Name || row.name || row["Brand Name"] || row["Brand"] || "";
          const api = row.API || row.api || row.Molecule || row["API Molecule"] || "";
          const category = row.Category || row.category || "General";
          const price = parseFloat(row.Price || row.price || row["Selling Price"] || 0);
          const parsedCost = parseFloat(row["Cost Price"] || row["Cost Price (NGN)"] || row.cost_price || row.Cost || row.cost || 0);
          const costPrice = !isNaN(parsedCost) && parsedCost > 0 ? parsedCost : Math.round(price * 0.7);
          const quantity = parseInt(row.Quantity || row.quantity || row.Qty || row.qty || 0);
          const pomRaw = row.POM || row.pom || "No";
          const pom = pomRaw.toString().toLowerCase() === "yes" || 
                      pomRaw.toString().toLowerCase() === "true" || 
                      pomRaw === true || 
                      pomRaw === 1;

          const threshold = parseInt(row["Low Stock Threshold"] || row.low_stock_threshold || row["Threshold"] || row.threshold || 10);
          const expMonth = parseInt(row["Expiry Month"] || row.expiry_month || row["Month"] || row.month || 12);
          const expYear = parseInt(row["Expiry Year"] || row.expiry_year || row["Year"] || row.year || 2027);
          const drugType = (row["Type"] || row["Drug Type"] || row.drug_type || row.type || "Tablet").toString().trim();

          if (name && api) {
            parsedProducts.push({
              id: `bulk-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
              name: name.toString().trim(),
              api_molecule: api.toString().trim(),
              category: category.toString().trim(),
              price,
              cost_price: costPrice,
              quantity,
              pom,
              low_stock_threshold: threshold,
              expiry_month: expMonth,
              expiry_year: expYear,
              drug_type: drugType,
              pharmacyId: currentPharmacy?.id || "gpharm-lagos-hq"
            });
          }
        });

        if (parsedProducts.length === 0) {
          alert("⚠️ No valid products found. Ensure columns match Name, API, Category, Price, Quantity, POM.");
          return;
        }

        let updatedList = [...parsedProducts, ...products];

        if (dbStatus === "connected" && supabase) {
          const { error } = await supabase
            .from("pharmacy_inventory")
            .insert(parsedProducts);
          if (error) {
            addLog(`Supabase bulk insert error: ${error.message}`);
          } else {
            addLog(`Synced ${parsedProducts.length} excel records to Cloud!`);
          }
        }

        await saveProductsList(updatedList);
        alert(`✅ Successfully imported ${parsedProducts.length} medical products!`);
        e.target.value = ""; // Clear file selector

      } catch (err: any) {
        console.error(err);
        alert("❌ Failed to parse Excel sheet. Ensure layout is standard.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generator for demo excel so that the client can test file uploads instantly
  const downloadDemoExcel = () => {
    const demoData = [
      { Name: "Co-Diovan 160mg", API: "Valsartan / Hydrochlorothiazide", Category: "Antihypertensives & Cardio", Price: 14500, "Cost Price": 10150, Quantity: 15, POM: "Yes", "Low Stock Threshold": 10, "Expiry Month": 9, "Expiry Year": 2026, "Drug Type": "Tablet" },
      { Name: "Malar-2 (Adult)", API: "Artemether / Lumefantrine", Category: "Antimalarials", Price: 1800, "Cost Price": 1260, Quantity: 40, POM: "No", "Low Stock Threshold": 20, "Expiry Month": 8, "Expiry Year": 2026, "Drug Type": "Tablet" },
      { Name: "Zinnat 500mg", API: "Cefuroxime", Category: "Antibiotics", Price: 11000, "Cost Price": 7700, Quantity: 6, POM: "Yes", "Low Stock Threshold": 15, "Expiry Month": 11, "Expiry Year": 2026, "Drug Type": "Tablet" },
      { Name: "Actifed Cold Tab", API: "Triprolidine / Pseudoephedrine", Category: "Analgesics", Price: 1400, "Cost Price": 980, Quantity: 120, POM: "No", "Low Stock Threshold": 10, "Expiry Month": 5, "Expiry Year": 2027, "Drug Type": "Tablet" },
      { Name: "Amloc 5mg", API: "Amlodipine", Category: "Antihypertensives & Cardio", Price: 4200, "Cost Price": 2940, Quantity: 22, POM: "Yes", "Low Stock Threshold": 10, "Expiry Month": 12, "Expiry Year": 2027, "Drug Type": "Tablet" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(demoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lagos Inventory");
    XLSX.writeFile(workbook, "GPharm_Lagos_Inventory_Template.xlsx");
    addLog("Downloaded sample Excel inventory template.");
  };

  // --- 5B. Export Current Stock List (Admin & Super Admin) ---
  const exportCurrentStock = () => {
    if (activePharmacyProducts.length === 0) {
      alert("⚠️ No inventory records available for this pharmacy workspace to export.");
      return;
    }
    // Format headers and data
    const exportData = activePharmacyProducts.map((p) => ({
      "Brand Name": p.name,
      "API Molecule": p.api_molecule,
      "Category": p.category,
      "Selling Price (NGN)": p.price,
      "Cost Price (NGN)": p.cost_price ?? Math.round(p.price * 0.7),
      "Current Stock Qty": p.quantity,
      "POM Required": p.pom ? "Yes" : "No",
      "Low Stock Threshold": p.low_stock_threshold || 10,
      "Expiry Month": p.expiry_month || 12,
      "Expiry Year": p.expiry_year || 2027,
      "Drug Type": p.drug_type || "Tablet"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pocket Pharmacy Inventory");

    XLSX.writeFile(workbook, "Pocket_Pharmacy_Current_Stock.xlsx");
    addLog("Stock exported successfully as EXCEL.");
  };

  // --- 5C. Export Sales Report (Super Admin only) ---
  const exportSalesReport = (period: "day" | "week" | "month") => {
    const today = new Date();
    const getLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const localTodayStr = getLocalDateString(today);

    // Filter by date
    const filtered = activePharmacySales.filter((rec) => {
      if (period === "day") {
        return rec.date === localTodayStr;
      }

      // For week and month, calculate exact day differences
      const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      };

      try {
        const recDate = parseLocalDate(rec.date);
        const diffMs = today.getTime() - recDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (period === "week") {
          return diffDays >= 0 && diffDays <= 7;
        } else if (period === "month") {
          return diffDays >= 0 && diffDays <= 30;
        }
      } catch {
        return false;
      }
      return false;
    });

    if (filtered.length === 0) {
      alert(`⚠️ No sales records found for this period (${period}) to export.`);
      return;
    }

    // Format for export
    const exportData = filtered.map((rec) => ({
      "Transaction ID": rec.id,
      "Timestamp": rec.timestamp,
      "Date": rec.date,
      "Billed Items": rec.items.map(i => `${i.productName} (x${i.quantity})`).join("; "),
      "Cash Portion (NGN)": rec.cashPaid,
      "Transfer Portion (NGN)": rec.transferPaid,
      "Card Portion (NGN)": rec.cardPaid,
      "Total Amount (NGN)": rec.total,
      "Billed By": rec.userName || "System"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Sales Report - ${period.toUpperCase()}`);

    XLSX.writeFile(workbook, `Pocket_Pharmacy_Sales_Report_${period}_${localTodayStr}.xlsx`);
    addLog(`Sales report for last ${period} exported successfully as EXCEL.`);
  };

  // --- 5D. Export Sales Report by User ---
  const exportUserSalesReport = (username: string) => {
    const filtered = activePharmacySales.filter(rec => rec.userName === username);
    if (filtered.length === 0) {
      alert(`⚠️ No sales records found for user "${username}" to export.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const exportData = filtered.map((rec) => ({
      "Transaction ID": rec.id,
      "Timestamp": rec.timestamp,
      "Date": rec.date,
      "Billed Items": rec.items.map(i => `${i.productName} (x${i.quantity})`).join("; "),
      "Cash Portion (NGN)": rec.cashPaid,
      "Transfer Portion (NGN)": rec.transferPaid,
      "Card Portion (NGN)": rec.cardPaid,
      "Total Amount (NGN)": rec.total,
      "Billed By": rec.userName || "System"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Sales for ${username}`);
    
    XLSX.writeFile(workbook, `Pocket_Pharmacy_Sales_${username}_${todayStr}.xlsx`);
    addLog(`Sales report for user ${username} exported successfully as EXCEL.`);
  };

  // --- 5D. Unique users with sales or active in system ---
  const uniqueUsersWithSales = useMemo(() => {
    const users = new Set<string>();
    activePharmacySales.forEach(rec => {
      if (rec.userName) {
        users.add(rec.userName);
      }
    });
    // Add default users to make sure they are always selectable
    activePharmacyUsers.forEach(u => {
      if (u.username) {
        users.add(u.username);
      }
    });
    return Array.from(users).sort();
  }, [activePharmacySales, activePharmacyUsers]);

  // --- 5E. Filtered sales records by selected user filter ---
  const filteredSalesRecords = useMemo(() => {
    if (selectedUserFilter === "all") {
      return activePharmacySales;
    }
    return activePharmacySales.filter(rec => rec.userName === selectedUserFilter);
  }, [activePharmacySales, selectedUserFilter]);

  // --- 5F. Dynamic sales metrics ---
  const salesMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let dailyTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    activePharmacySales.forEach((rec) => {
      const recDateMs = new Date(rec.date).getTime();
      const diffDays = (nowMs - recDateMs) / oneDayMs;

      // Daily
      if (rec.date === todayStr) {
        dailyTotal += rec.total;
        dailyCount++;
      }
      // Weekly (last 7 days)
      if (diffDays <= 7) {
        weeklyTotal += rec.total;
        weeklyCount++;
      }
      // Monthly (last 30 days)
      if (diffDays <= 30) {
        monthlyTotal += rec.total;
        monthlyCount++;
      }
      // Yearly (last 365 days)
      if (diffDays <= 365) {
        yearlyTotal += rec.total;
        yearlyCount++;
      }
    });

    return {
      daily: { total: dailyTotal, count: dailyCount },
      weekly: { total: weeklyTotal, count: weeklyCount },
      monthly: { total: monthlyTotal, count: monthlyCount },
      yearly: { total: yearlyTotal, count: yearlyCount }
    };
  }, [salesRecords]);

  // --- 5E. Stock Taking Submission Handler ---
  const handleStockVerifyAndSync = async (productId: string) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const shelfInputVal = shelfCounts[productId];
    if (shelfInputVal === undefined || shelfInputVal.trim() === "") {
      alert("⚠️ Please enter a shelf count before verification.");
      return;
    }

    const shelfCountNum = parseInt(shelfInputVal);
    if (isNaN(shelfCountNum) || shelfCountNum < 0) {
      alert("⚠️ Please enter a valid non-negative integer count.");
      return;
    }

    const appCount = targetProduct.quantity;
    const discrepancy = shelfCountNum - appCount;
    const reason = discrepancyReasons[productId] || "";

    try {
      addLog(`Auditing Stock for ${targetProduct.name}. Shelf: ${shelfCountNum}, App: ${appCount}`);

      // Update in active products state
      const updatedProducts = products.map((prod) => {
        if (prod.id === productId) {
          return { ...prod, quantity: shelfCountNum };
        }
        return prod;
      });

      await saveProductsList(updatedProducts);

      // Sync individual update to Supabase
      if (dbStatus === "connected" && supabase) {
        const { error } = await supabase
          .from("pharmacy_inventory")
          .update({ quantity: shelfCountNum })
          .eq("id", productId);
        if (error) {
          console.error("Cloud stock audit sync error", error);
        } else {
          addLog(`Cloud audited quantity synced for ${targetProduct.name}.`);
        }
      }

      // Record to Audit History
      const newAudit: StockAuditEntry = {
        id: `ST-${Date.now()}`,
        date: auditDate,
        productName: targetProduct.name,
        appCount,
        shelfCount: shelfCountNum,
        discrepancy,
        reason: reason.trim() || "Regular Scheduled Audit Verification",
        timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
        pharmacyId: currentPharmacy?.id || "gpharm-lagos-hq",
        userId: currentUser?.id || "user-super",
        userName: currentUser?.username || "superadmin"
      };

      setStockAuditHistory(prev => {
        const updated = [newAudit, ...prev];
        localStorage.setItem("pocket_stock_audit_history", JSON.stringify(updated));
        return updated;
      });

      // Reset individual input fields
      setShelfCounts(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setDiscrepancyReasons(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });

      alert(`✅ STOCK AUDIT APPLIED SUCCESS\n${targetProduct.name} stock quantity updated to ${shelfCountNum} on application.`);
    } catch (err) {
      console.error(err);
      alert("❌ An error occurred while submitting stock audit.");
    }
  };

  // --- 5F. Stock Audit Scheduling Frequencies ---
  const handleAddStockFrequency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFreqNotes.trim()) {
      alert("⚠️ Please enter notes/purpose for this schedule.");
      return;
    }

    const newSchedule: StockFrequency = {
      id: `SF-${Date.now()}`,
      frequency: newFreq,
      targetDayOrDate: newFreqTarget,
      timeOfDay: newFreqTime,
      notes: newFreqNotes.trim(),
      enableAppNotification: newFreqAppNotification,
      enableEmailNotification: newFreqEmailNotification,
      notificationEmail: newFreqEmailNotification ? newFreqEmailAddress.trim() : undefined,
      pharmacyId: currentPharmacy?.id || "gpharm-lagos-hq"
    };

    setStockTakingFrequencies(prev => {
      const updated = [...prev, newSchedule];
      localStorage.setItem("pocket_stock_frequencies", JSON.stringify(updated));
      return updated;
    });

    // Also auto-simulate a confirmation / 24h prior notification entry in logs for instant verification
    const timestamp = new Date().toLocaleString();
    const autoLogs = [];
    if (newFreqAppNotification) {
      autoLogs.push({
        id: `REM-APP-${Date.now()}-init`,
        timestamp,
        scheduleId: newSchedule.id,
        scheduleDetails: `${newFreq} - ${newFreqTarget} at ${newFreqTime}`,
        type: "app" as const,
        message: `🔔 24-Hour Notice Activated: Scheduled ${newFreq} physical audit cycle tomorrow. Notes: ${newFreqNotes.trim()}`
      });
    }
    if (newFreqEmailNotification) {
      autoLogs.push({
        id: `REM-EMAIL-${Date.now()}-init`,
        timestamp,
        scheduleId: newSchedule.id,
        scheduleDetails: `${newFreq} - ${newFreqTarget} at ${newFreqTime}`,
        type: "email" as const,
        message: `✉️ [Email Sent] 24-Hour Prior Reminder Notice dispatched to ${newFreqEmailAddress.trim()}. Notes: ${newFreqNotes.trim()}`,
        recipient: newFreqEmailAddress.trim()
      });
    }

    if (autoLogs.length > 0) {
      setReminderLogs(prev => {
        const updated = [...autoLogs, ...prev];
        localStorage.setItem("pocket_audit_reminder_logs", JSON.stringify(updated));
        return updated;
      });
    }

    setNewFreqNotes("");
    addLog(`Scheduled ${newFreq} stock audit at ${newFreqTime} with active notifications.`);
    alert(`📅 Scheduled ${newFreq} Stock audit at ${newFreqTime} successfully!\n\nReminders are configured to alert 24 hours prior via ${
      [newFreqAppNotification ? "App" : "", newFreqEmailNotification ? "Email (" + newFreqEmailAddress + ")" : ""].filter(Boolean).join(" & ")
    }.`);
  };

  const handleDeleteFrequency = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled stock taking frequency?")) {
      setStockTakingFrequencies(prev => {
        const updated = prev.filter(f => f.id !== id);
        localStorage.setItem("pocket_stock_frequencies", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // --- 5G. Simulate 24-Hour Prior Stock Audit Notification Notice ---
  const triggerSimulationReminder = (schedule: StockFrequency) => {
    const timestamp = new Date().toLocaleString();
    const mockAppLog = {
      id: `REM-APP-${Date.now()}`,
      timestamp,
      scheduleId: schedule.id,
      scheduleDetails: `${schedule.frequency} - ${schedule.targetDayOrDate} at ${schedule.timeOfDay}`,
      type: "app" as const,
      message: `🔔 24-Hour Notice: Scheduled ${schedule.frequency} physical audit cycle is approaching tomorrow! (Scope: ${schedule.notes})`,
    };

    const mockEmailLog = {
      id: `REM-EMAIL-${Date.now()}`,
      timestamp,
      scheduleId: schedule.id,
      scheduleDetails: `${schedule.frequency} - ${schedule.targetDayOrDate} at ${schedule.timeOfDay}`,
      type: "email" as const,
      message: `✉️ [Email Sent] 24-Hour Prior Reminder Notice dispatched to ${schedule.notificationEmail || "onyemekamichael@gmail.com"}. Subject: [GPharm Audit Alert] Scheduled Stock-Take tomorrow. Notes: ${schedule.notes}`,
      recipient: schedule.notificationEmail || "onyemekamichael@gmail.com"
    };

    const logsToAdd = [];
    if (schedule.enableAppNotification) logsToAdd.push(mockAppLog);
    if (schedule.enableEmailNotification) logsToAdd.push(mockEmailLog);

    if (logsToAdd.length === 0) {
      alert("⚠️ Both App and Email notification alerts are disabled for this schedule.");
      return;
    }

    setReminderLogs(prev => {
      const updated = [...logsToAdd, ...prev];
      localStorage.setItem("pocket_audit_reminder_logs", JSON.stringify(updated));
      return updated;
    });

    addLog(`Simulated 24-Hour Prior notice triggered for schedule ${schedule.frequency}`);
    
    let alertMsg = `🚀 SIMULATION 24H DISPATCH SUCCESSFUL!\n\n`;
    if (schedule.enableAppNotification) {
      alertMsg += `📱 App Notification Generated:\n"${mockAppLog.message}"\n\n`;
    }
    if (schedule.enableEmailNotification) {
      alertMsg += `✉️ Email Notification Sent to ${schedule.notificationEmail || "onyemekamichael@gmail.com"}:\n"${mockEmailLog.message}"\n\n`;
    }
    alertMsg += `Note: System checks and auto-dispatches notifications exactly 24 hours prior in production. Logs have been updated.`;

    alert(alertMsg);
  };

  const handleClearReminderLogs = () => {
    if (confirm("Are you sure you want to clear all simulated notification logs?")) {
      setReminderLogs([]);
      localStorage.removeItem("pocket_audit_reminder_logs");
      addLog("Notification reminder logs cleared.");
    }
  };

  // --- 6. Staff AI Consult (Lagos Clinical Pharmacist via backend) ---
  const requestAiConsult = async (product: Product) => {
    setConsultingProduct(product);
    setAiResponse("");
    setCustomQuery("");
    setAiResponse("");
    setIsAiLoading(true);

    try {
      addLog(`Triggered Gemini AI Consult for ${product.name}`);
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          brandName: product.name,
          molecule: product.api_molecule,
          category: product.category
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.result);
        addLog(`Consult received for ${product.name}.`);
      } else {
        setAiResponse(`❌ Clinical server: ${data.error || "Consult failed."}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiResponse(`❌ Connection lost to GPharm clinical API server. Please retry.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const submitCustomAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    setAiResponse("");
    setIsAiLoading(true);
    addLog(`AI Custom Query submitted: ${customQuery}`);

    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          brandName: customQuery,
          molecule: "Custom request / Question",
          category: "General Practice"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.result);
      } else {
        setAiResponse(`❌ Consult server error: ${data.error}`);
      }
    } catch (err) {
      setAiResponse("❌ Network error. Ensure the full-stack server is running.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- 7. Window Object Attachments (Handshake criteria) ---
  useEffect(() => {
    (window as any).saveManualProduct = (name: string, api: string, cat: string, priceVal: number, qtyVal: number, isPom: boolean) => {
      const p: Product = {
        id: `window-${Date.now()}`,
        name,
        api_molecule: api,
        category: cat,
        price: priceVal,
        quantity: qtyVal,
        pom: isPom
      };
      saveProductsList([p, ...products]);
      addLog(`Added manual product via global console scope: ${name}`);
      return "Product saved successfully.";
    };

    (window as any).finalizeSale = () => {
      if (canFinalize) {
        finalizeSale();
        return "Transaction finalized.";
      }
      return "Cannot finalize: Payment insufficient or cart empty.";
    };

    (window as any).addToCart = (productId: string) => {
      const target = products.find(p => p.id === productId);
      if (target) {
        addToCart(target);
        return `Added ${target.name} to cart.`;
      }
      return "Product not found.";
    };

    (window as any).triggerAiConsult = (brandName: string, molecule: string) => {
      const dummyProd: Product = {
        id: "temp",
        name: brandName,
        api_molecule: molecule,
        category: "Consult Mode",
        price: 0,
        quantity: 0,
        pom: false
      };
      requestAiConsult(dummyProd);
      return `Consultation triggered for ${brandName}`;
    };

    (window as any).logout = () => {
      handleLogout();
    };

    (window as any).login = (code: string) => {
      const matchingUser = appUsers.find(u => u.pinCode === code);
      if (matchingUser) {
        const matchingPharm = pharmacies.find(p => p.id === matchingUser.pharmacyId) || pharmacies[0];
        setCurrentUser(matchingUser);
        setCurrentPharmacy(matchingPharm);
        setIsLoggedIn(true);
        setCurrentRole(matchingUser.role);
        localStorage.setItem("gpharm_is_logged_in", "true");
        localStorage.setItem("gpharm_role", matchingUser.role);
        localStorage.setItem("pocket_current_user", JSON.stringify(matchingUser));
        localStorage.setItem("pocket_current_pharmacy", JSON.stringify(matchingPharm));
        return `Unlocked as ${matchingUser.role} (User: ${matchingUser.username}).`;
      }
      return "Incorrect code.";
    };
  }, [products, cartTotal, paymentCash, paymentTransfer, paymentCard]);

  // --- Render Login Screen ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-[#0a4a3a] selection:text-white">
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full ${isRegistering ? "max-w-2xl" : "max-w-md"} bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300`}
        >
          {/* Header */}
          <div className="bg-[#0a4a3a] text-white p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Plus className="w-40 h-40 stroke-[4px]" />
            </div>
            
            <div className="mx-auto bg-white/15 w-14 h-14 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
              <Plus className="w-9 h-9 text-emerald-300 stroke-[3px]" />
            </div>
            
            <h1 className="font-display font-bold text-2xl tracking-tight">Pocket Pharmacy</h1>
            <p className="text-emerald-200 text-[10px] font-mono tracking-widest mt-0.5 uppercase">B2B Multi-Tenant POS & Stock Manager</p>
          </div>

          {/* Form */}
          <div className="p-6">
            
            {/* Segmented Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setPinError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isRegistering ? "bg-white text-[#0a4a3a] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                🔒 Staff Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setPinError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isRegistering ? "bg-white text-[#0a4a3a] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                🚀 Onboard Pharmacy
              </button>
            </div>

            {!isRegistering ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">STAFF USERNAME</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. cashier, admin or superadmin"
                      className="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 focus:border-[#0a4a3a] transition-all font-mono"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">SECURITY PASSWORD (6-10 CHARS)</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      maxLength={10}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. Super1@ or Cash1$"
                      className="w-full bg-slate-50 text-slate-900 font-mono text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 focus:border-[#0a4a3a] transition-all font-bold"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Must contain 6-10 chars with letters, numbers & special symbol</p>
                </div>

                {pinError && (
                  <p className="text-red-600 text-xs text-center font-semibold mt-1 bg-red-50 py-1.5 rounded-lg border border-red-100">{pinError}</p>
                )}

                <button
                  type="submit"
                  disabled={pinCode.length === 0}
                  className="w-full bg-[#0a4a3a] hover:bg-[#073a2e] disabled:bg-slate-300 text-white font-semibold text-sm p-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Unlock Secure Terminal
                </button>
              </form>
            ) : (
              /* ONBOARDING REGISTRATION FORM */
              <form onSubmit={handleRegisterPharmacy} className="space-y-4">
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs space-y-1.5 border border-emerald-100 mb-2">
                  <p className="font-bold">✨ Register as New Independent Pharmacy Space</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Create an isolated, dedicated database workspace for your pharmacy operations. You will be assigned as the **Super Admin** of this pharmacy workspace.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">PHARMACY NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Trust & Care Pharmacy"
                      value={regPharmacyName}
                      onChange={(e) => setRegPharmacyName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 text-slate-800 focus:border-[#0a4a3a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">DIRECTOR NAME (PROMOTER)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Michael Onyeka"
                      value={regPromoterName}
                      onChange={(e) => setRegPromoterName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 text-slate-800 focus:border-[#0a4a3a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">TELEPHONE CONTACT</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +234 803 111 2222"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 text-slate-800 focus:border-[#0a4a3a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. contact@mypharmacy.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 text-slate-800 focus:border-[#0a4a3a]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">HEADQUARTERS LOCATION</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ikeja, Lagos, Nigeria"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 text-slate-800 focus:border-[#0a4a3a]"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 mt-1 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">DESIRED USERNAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. michael"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 font-mono focus:border-[#0a4a3a]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">DESIRED PASSWORD (6-10 CHARS)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      maxLength={10}
                      placeholder="e.g. Super1@"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]/20 font-mono focus:border-[#0a4a3a] font-bold tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0a4a3a] hover:bg-[#073a2e] text-white font-bold text-sm p-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  Create Pharmacy Workspace & Log In
                </button>
              </form>
            )}

          </div>
        </motion.div>
      </div>
    );
  }

  // --- Render Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-100">
      
      {/* 1. Header and System Status Bar */}
      <header className="bg-[#0a4a3a] text-white shadow-xl border-b border-emerald-950 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                <Plus className="w-8 h-8 text-[#0a4a3a] stroke-[3px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-2xl tracking-tight leading-none">Pocket Pharmacy</span>
                  <span className="bg-emerald-900 border border-emerald-700 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Clinical Suite</span>
                </div>
                <p className="text-emerald-200/80 text-[10px] uppercase font-mono tracking-wider mt-0.5">Clinical Inventory & POS</p>
              </div>
            </div>

            {/* Middle Live replication Status Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-emerald-950/65 rounded-xl border border-emerald-800/80 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                  dbStatus === "connected" 
                    ? "bg-emerald-400 animate-pulse" 
                    : dbStatus === "connecting" 
                      ? "bg-amber-400 animate-pulse" 
                      : "bg-blue-400"
                }`} />
                <span className="font-semibold text-slate-100 font-mono">
                  {dbStatus === "connected" && (
                    <>
                      <span className="hidden sm:inline">Cloud Synced</span>
                      <span className="inline sm:hidden">Synced</span>
                    </>
                  )}
                  {dbStatus === "connecting" && (
                    <>
                      <span className="hidden sm:inline">Syncing...</span>
                      <span className="inline sm:hidden">Syncing</span>
                    </>
                  )}
                  {dbStatus === "local_fallback" && (
                    <>
                      <span className="hidden sm:inline">Local Backup</span>
                      <span className="inline sm:hidden">Offline</span>
                    </>
                  )}
                </span>
              </div>
              <span className="text-emerald-500 font-mono text-[9px] sm:text-xs">|</span>
              <button 
                onClick={triggerManualSync}
                className="text-emerald-300 hover:text-white flex items-center gap-1 font-bold transition-all focus:outline-none bg-emerald-900/40 hover:bg-emerald-900 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-emerald-700/50"
                title="Refresh and synchronize inventory instantly with all terminal users"
              >
                <RefreshCw className={`w-2.5 h-2.5 sm:w-3 h-3 ${dbStatus === "connecting" ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Profile Indicator */}
              <div className="bg-emerald-950 px-3.5 py-2 rounded-xl border border-emerald-800 flex items-center gap-2">
                {currentRole === "super_admin" ? (
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                ) : currentRole === "admin" ? (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                ) : (
                  <User className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-200 text-xs font-mono font-bold uppercase tracking-wider">
                  {currentRole === "super_admin" ? "Super Admin" : currentRole === "admin" ? "Admin Mode" : "Cashier Mode"}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-emerald-950 hover:bg-rose-950 border border-emerald-800 hover:border-rose-900 p-2.5 rounded-xl text-slate-300 hover:text-white transition-all duration-200"
                title="Log out of Terminal"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Banner Alert for Emergency Medical Supplies / POM Rules */}
        <div className="bg-slate-900 border-l-4 border-amber-500 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 text-slate-100 shadow-sm">
          <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200">
            Please request a valid prescription for any medicines tagged with red <span className="bg-red-950 border border-red-800 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">POM</span>.
          </p>
        </div>

        {/* Clinical Alerts Notification Center */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 text-[#0a4a3a] p-2.5 rounded-xl border border-emerald-100 relative">
                <Bell className="w-5 h-5" />
                {(clinicalAlerts.lowStock.length > 0 || clinicalAlerts.expiring.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white font-mono text-[9px] flex items-center justify-center rounded-full font-bold">
                    {clinicalAlerts.lowStock.length + clinicalAlerts.expiring.length}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Clinical Alert & Pharmacovigilance Center</h3>
                <p className="text-xs text-slate-500">Real-time status tracking for clinical inventory levels and expiry deadlines.</p>
              </div>
            </div>

            <div className="flex gap-2 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveAlertTab("low")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAlertTab === "low"
                    ? "bg-white text-[#0a4a3a] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Low Stock ({clinicalAlerts.lowStock.length})
              </button>
              <button
                onClick={() => setActiveAlertTab("expiry")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAlertTab === "expiry"
                    ? "bg-white text-amber-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Expiring Soon ({clinicalAlerts.expiring.length})
              </button>
            </div>
          </div>

          <div className="p-5 max-h-64 overflow-y-auto">
            {activeAlertTab === "low" ? (
              clinicalAlerts.lowStock.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clinicalAlerts.lowStock.map((p) => {
                    const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 10;
                    return (
                      <div 
                        key={p.id}
                        className="bg-rose-50/50 border border-rose-100 hover:border-rose-300 p-3 rounded-xl flex items-center justify-between transition-all animate-fade-in"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 text-xs sm:text-sm">{p.name}</span>
                            {p.drug_type && (
                              <span className="bg-emerald-50 border border-emerald-100 text-[#0a4a3a] text-[8px] font-mono font-bold px-1 rounded uppercase">
                                {p.drug_type}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono italic">{p.api_molecule}</p>
                          <p className="text-[11px] text-rose-750 font-semibold">
                            Only <span className="font-bold text-rose-800">{p.quantity} Units</span> left in stock.
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-block">
                            MIN: {threshold}
                          </span>
                          <button
                            onClick={() => {
                              setSearchQuery(p.name);
                            }}
                            className="block w-full text-[10px] text-slate-500 hover:text-[#0a4a3a] underline font-bold"
                          >
                            Locate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Perfect Stock Levels</p>
                  <p className="text-[11px] text-slate-400">All pharmacy items currently exceed low-stock thresholds.</p>
                </div>
              )
            ) : (
              clinicalAlerts.expiring.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clinicalAlerts.expiring.map(({ product: p, diffMonths, status }) => {
                    return (
                      <div 
                        key={p.id}
                        className="bg-amber-50/50 border border-amber-100 hover:border-amber-300 p-3 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 text-xs sm:text-sm">{p.name}</span>
                            {p.drug_type && (
                              <span className="bg-[#0a4a3a]/10 text-[#0a4a3a] text-[8px] font-mono font-bold px-1 rounded uppercase">
                                {p.drug_type}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono italic">{p.api_molecule}</p>
                          <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Expiry: {String(p.expiry_month).padStart(2, "0")}/{p.expiry_year}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block font-mono ${
                            diffMonths < 0 
                              ? "bg-red-100 text-red-700 animate-pulse" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {status.toUpperCase()}
                          </span>
                          <button
                            onClick={() => {
                              setSearchQuery(p.name);
                            }}
                            className="block w-full text-[10px] text-slate-500 hover:text-[#0a4a3a] underline font-bold"
                          >
                            Locate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Expiring Products</p>
                  <p className="text-[11px] text-slate-400">All products have comfortable shelf lives (greater than 2 months).</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* POS Catalog & Search Area - 7 cols on large screens */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Sales Section Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold font-display text-slate-900">POS Sales Desk</h2>
                  <p className="text-xs text-slate-500">Search and dispense clinical inventory items below.</p>
                </div>
                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4a3a]"
                >
                  {DRUG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Brand Name, Active API Molecule, or Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] transition-all text-slate-900 placeholder:text-slate-400"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Product Cards Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2">
              <AnimatePresence>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 10;
                    const isLowStock = p.quantity <= threshold;
                    const isOutOfStock = p.quantity <= 0;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        key={p.id}
                        className={`bg-white rounded-lg p-2.5 border shadow-2xs transition-all flex flex-col justify-between ${
                          isOutOfStock 
                            ? "border-slate-200 opacity-60 bg-slate-50" 
                            : isLowStock 
                              ? "border-red-200 hover:border-red-400" 
                              : "border-slate-200 hover:border-[#0a4a3a] hover:shadow-sm"
                        }`}
                      >
                        <div>
                          {/* Tags row */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[8px] font-mono tracking-wider bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold uppercase truncate max-w-[80px]">
                              {p.drug_type || p.category}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {p.pom && (
                                <span className="text-[7px] font-mono bg-red-100 text-red-700 border border-red-200 px-1 py-0.2 rounded font-extrabold">
                                  POM
                                </span>
                              )}
                              <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
                                isOutOfStock 
                                  ? "bg-slate-200 text-slate-600" 
                                  : isLowStock 
                                    ? "bg-red-100 text-red-700" 
                                    : "bg-emerald-50 text-emerald-800"
                              }`}>
                                {isOutOfStock ? "Out" : `${p.quantity}`}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-display font-bold text-slate-900 text-xs truncate" title={p.name}>{p.name}</h3>
                          <p className="text-[10px] text-slate-500 font-mono truncate" title={p.api_molecule}>{p.api_molecule}</p>

                          {/* Expiry Badge */}
                          {p.expiry_month && p.expiry_year && (
                            <div className="mt-1 text-[8px] font-mono text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-2 h-2 text-amber-500" />
                              <span>EXP: {String(p.expiry_month).padStart(2, "0")}/{p.expiry_year}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between items-center gap-1">
                          <div>
                            <span className="text-xs font-extrabold text-[#0a4a3a] font-mono block">
                              ₦{p.price.toLocaleString("en-NG")}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {(currentRole === "admin" || currentRole === "super_admin") && (
                              <button
                                onClick={() => requestAiConsult(p)}
                                className="bg-emerald-50 text-[#0a4a3a] border border-emerald-200 p-1 rounded-md hover:bg-[#0a4a3a] hover:text-white transition-all flex items-center justify-center"
                                title="Run GPharm AI Clinical Consult"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                              </button>
                            )}

                            <button
                              disabled={isOutOfStock}
                              onClick={() => addToCart(p)}
                              className={`px-2 py-1 rounded-md font-bold text-[10px] flex items-center gap-0.5 transition-all ${
                                isOutOfStock 
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                  : "bg-[#0a4a3a] hover:bg-[#073a2e] text-white active:scale-95"
                              }`}
                            >
                              <ShoppingCart className="w-2.5 h-2.5" />
                              Add
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-800">No matching medical items</h3>
                    <p className="text-xs text-slate-500 mt-1">Try refining your keyword search query or changing active category filter.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </section>

          {/* POS Bill, Split Payments, & Cart System - 5 cols */}
          <section className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              
              {/* Sidebar Header */}
              <div className="bg-[#0a4a3a] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-300" />
                  <h3 className="font-display font-bold text-lg">Active Bill Desk</h3>
                </div>
                <span className="bg-emerald-900 border border-emerald-700 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                  {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Cart List */}
              <div className="p-5 max-h-[320px] overflow-y-auto divide-y divide-slate-100 flex-1">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                          {item.product.pom && (
                            <span className="text-[8px] bg-red-100 text-red-700 font-mono px-1 py-0.1 rounded font-bold">POM</span>
                          )}
                        </div>
                        <p className="text-xs text-[#0a4a3a] font-mono font-bold">
                          ₦{(item.product.price * item.quantity).toLocaleString("en-NG")} 
                          <span className="text-slate-400 font-normal"> (₦{item.product.price.toLocaleString("en-NG")} each)</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity controls */}
                        <div className="bg-slate-100 px-2 py-1 rounded-xl flex items-center gap-2 border border-slate-200">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                            className="text-slate-600 hover:text-[#0a4a3a] font-extrabold w-5 h-5 rounded-md hover:bg-white flex items-center justify-center focus:outline-none"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                            className="text-slate-600 hover:text-[#0a4a3a] font-extrabold w-5 h-5 rounded-md hover:bg-white flex items-center justify-center focus:outline-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Trash */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors focus:outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2.5 stroke-1" />
                    <p className="text-sm">Billing Cart is currently empty</p>
                    <p className="text-xs text-slate-400 mt-1">Select medicines from the catalog to populate bill.</p>
                  </div>
                )}
              </div>

              {/* Bill Summary Block */}
              <div className="bg-slate-50 p-5 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400 uppercase font-mono font-bold">TOTAL SUM DUE:</span>
                  <span className="text-3xl font-mono font-extrabold text-[#0a4a3a]">
                    ₦{cartTotal.toLocaleString("en-NG")}
                  </span>
                </div>

                {/* Split Payments Form */}
                {cart.length > 0 && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1 text-slate-500 pb-1 border-b border-slate-100">
                      <Layers className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono">B2B Nigeria Split Payment Processor (₦)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase text-slate-500">Cash (₦)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={paymentCash}
                          onChange={(e) => setPaymentCash(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0a4a3a]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase text-slate-500">Bank Transfer</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={paymentTransfer}
                          onChange={(e) => setPaymentTransfer(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0a4a3a]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase text-slate-500">Card (POS)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={paymentCard}
                          onChange={(e) => setPaymentCard(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#0a4a3a]"
                        />
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Total Paid sum:</span>
                        <span className="font-mono font-bold text-slate-900">₦{totalPaid.toLocaleString("en-NG")}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Remaining Balance:</span>
                        <span className={`font-mono font-bold ${totalPaid >= cartTotal ? "text-emerald-600" : "text-amber-600"}`}>
                          {totalPaid >= cartTotal 
                            ? "Paid" 
                            : `₦${(cartTotal - totalPaid).toLocaleString("en-NG")} pending`}
                        </span>
                      </div>
                      {totalPaid > cartTotal && (
                        <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-1.5 rounded font-bold font-mono text-[10px]">
                          <span>CHANGE / BALANCE RETURN DUE:</span>
                          <span>₦{changeDue.toLocaleString("en-NG")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Finalize Button */}
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-300 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold transition-all focus:outline-none"
                  >
                    Clear Bill
                  </button>
                  <button
                    disabled={!canFinalize}
                    onClick={finalizeSale}
                    className={`flex-1 font-semibold text-sm p-3.5 rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2 ${
                      canFinalize 
                        ? "bg-[#0a4a3a] hover:bg-[#073a2e] text-white hover:-translate-y-0.5" 
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    Finalize Sale (Deduct Stock)
                  </button>
                </div>

                {!canFinalize && cart.length > 0 && (
                  <p className="text-amber-700 text-[10px] text-center font-mono font-bold bg-amber-50 rounded p-1 border border-amber-200">
                    ⚠️ Enter payments sum above: (Cash + Transfer + Card) must be ≥ ₦{cartTotal.toLocaleString("en-NG")}
                  </p>
                )}

              </div>

            </div>

          </section>

        </div>

        {/* Staff Clinical Assistant (Gemini 1.5/3.5 Flash) Hub */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0a4a3a] text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-xl">
                <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">Staff AI Consult Terminal</h2>
              </div>
            </div>
            
            {/* Visual lock status */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded font-bold ${
                (currentRole === "admin" || currentRole === "super_admin") 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                  : "bg-slate-800 text-slate-400"
              }`}>
                {(currentRole === "admin" || currentRole === "super_admin") ? "🔑 Admin Access Active" : "🔒 Restricted to Admins"}
              </span>
            </div>
          </div>

          {!(currentRole === "admin" || currentRole === "super_admin") ? (
            <div className="p-8 text-center bg-slate-50 text-slate-400">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800">Pharmacist Credentials Required</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Clinical AI Consult operations are internal only. Please switch the session operator profile at the header to <span className="font-bold text-[#0a4a3a]">Admin AI</span> to unlocked clinical decision guidelines.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* Form Input Side */}
              <div className="lg:col-span-5 p-6 space-y-4">
                <p className="text-xs text-slate-500">Check clinical bio-equivalents and market price instantly.</p>
                
                <form onSubmit={submitCustomAiQuery} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Enter Drug / Brand / Molecule name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Augmentin, Ventolin, Artemether..."
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={isAiLoading || !customQuery.trim()}
                        className="bg-[#0a4a3a] hover:bg-[#073a2e] disabled:bg-slate-300 text-white font-semibold text-xs px-4 rounded-xl shadow transition-all focus:outline-none"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Response Output Side */}
              <div className="lg:col-span-7 p-6 flex flex-col justify-between min-h-[250px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 font-mono">ADVISOR REPORT FEED</span>
                    {consultingProduct && (
                      <span className="text-xs font-semibold bg-emerald-50 border border-emerald-200 text-[#0a4a3a] px-2.5 py-0.5 rounded-full">
                        Query: {consultingProduct.name}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 text-slate-200 p-5 rounded-xl font-mono text-xs leading-relaxed min-h-[160px] max-h-[300px] overflow-y-auto whitespace-pre-wrap border border-slate-800">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-emerald-400 animate-pulse">Consulting Lagos clinical directories...</p>
                      </div>
                    ) : aiResponse ? (
                      <div>
                        {aiResponse}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-center py-12">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        <p>Awaiting search parameter queries or quick consult triggers...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <p>⚠️ Clinical drug indexes are updated bi-weekly.</p>
                  {aiResponse && (
                    <button 
                      onClick={() => {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`<pre style="font-family: monospace; padding: 20px;">${aiResponse}</pre>`);
                          win.document.close();
                        }
                      }}
                      className="text-[#0a4a3a] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Printer className="w-3 h-3" />
                      Print Consult Note
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}
        </section>

        {/* ==================== 👑 SUPER ADMIN AUTHORITY HUB ==================== */}
        {currentRole === "super_admin" && (
          <section className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Header / Brand Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 p-6 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                    Super Admin Clearance Hub
                    <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-cyan-500/30 font-bold">Level 3 Terminal</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Consolidated Ledger Audit, Real-time Discrepancy Managers, and Frequency Schedulers</p>
                </div>
              </div>

              {/* Hub Tabs Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch lg:self-auto overflow-x-auto">
                {[
                  { id: "sales", label: "📊 Sales Dashboard", icon: BarChart3 },
                  { id: "stocktake", label: "📋 Stock Auditor", icon: Layers },
                  { id: "frequencies", label: "⏰ Audit Scheduler & Logs", icon: Calendar },
                  { id: "staff", label: "👥 Staff & Features Directory", icon: Users },
                  { id: "pharmacy_profile", label: "🏢 Pharmacy Workspace Profile", icon: Building2 }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = superAdminTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSuperAdminTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? "bg-[#0a4a3a] text-white shadow-lg"
                          : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="p-6">
              
              {/* PANEL 1: SALES LEDGER & DASHBOARD */}
              {superAdminTab === "sales" && (
                <div className="space-y-6">
                  {/* KPI Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { title: "Today's Revenue", amount: salesMetrics.daily.total, count: salesMetrics.daily.count, color: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/20", icon: DollarSign, text: "text-emerald-400" },
                      { title: "Weekly Revenue", amount: salesMetrics.weekly.total, count: salesMetrics.weekly.count, color: "from-cyan-500/10 to-blue-500/5", border: "border-cyan-500/20", icon: TrendingUp, text: "text-cyan-400" },
                      { title: "Monthly Revenue", amount: salesMetrics.monthly.total, count: salesMetrics.monthly.count, color: "from-indigo-500/10 to-purple-500/5", border: "border-indigo-500/20", icon: BarChart3, text: "text-indigo-400" },
                      { title: "Annual Forecast", amount: salesMetrics.yearly.total, count: salesMetrics.yearly.count, color: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/20", icon: Layers, text: "text-amber-400" }
                    ].map((metric, i) => {
                      const Icon = metric.icon;
                      return (
                        <div key={i} className={`bg-gradient-to-br ${metric.color} p-2.5 rounded-xl border ${metric.border} flex flex-col justify-between`}>
                          <div className="flex justify-between items-center gap-1">
                            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-tight font-bold truncate">{metric.title}</span>
                            <div className="bg-slate-950 p-1 rounded border border-slate-800 shrink-0">
                              <Icon className={`w-3 h-3 ${metric.text}`} />
                            </div>
                          </div>
                          <div className="mt-1.5">
                            <span className="text-sm font-extrabold font-mono tracking-tight text-white block leading-none">
                              ₦{metric.amount.toLocaleString("en-NG")}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-1 leading-none">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              {metric.count} Invoices
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Report Exports section */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col xl:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">Generate Auditor Ledger Reports</h4>
                      <p className="text-xs text-slate-400">Download formatted sales journals with payment breakdowns directly to your device.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 self-stretch xl:self-auto">
                      {/* Today */}
                      <button
                        onClick={() => exportSalesReport("day")}
                        className="flex-1 sm:flex-none bg-[#0a4a3a] hover:bg-[#073a2e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-600 font-sans"
                        title="Export today's ledger as Excel"
                      >
                        <Download className="w-4 h-4 text-emerald-300" />
                        Today (Excel)
                      </button>

                      {/* Weekly */}
                      <button
                        onClick={() => exportSalesReport("week")}
                        className="flex-1 sm:flex-none bg-slate-850 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700 font-sans"
                        title="Export weekly ledger as Excel"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                        Weekly (Excel)
                      </button>

                      {/* Monthly */}
                      <button
                        onClick={() => exportSalesReport("month")}
                        className="flex-1 sm:flex-none bg-slate-850 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700 font-sans"
                        title="Export monthly ledger as Excel"
                      >
                        <Download className="w-4 h-4 text-indigo-400" />
                        Monthly (Excel)
                      </button>
                    </div>
                  </div>

                  {/* Sales Records Grid */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 font-mono">LIVE CONSOLIDATED SALES JOURNAL</span>
                        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Staff Filter:</label>
                          <select
                            value={selectedUserFilter}
                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                            className="bg-slate-900 border-none text-slate-200 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono cursor-pointer"
                          >
                            <option value="all">All Staff</option>
                            {uniqueUsersWithSales.map((username) => (
                              <option key={username} value={username}>
                                {username}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-start">
                        {selectedUserFilter !== "all" && (
                          <button
                            onClick={() => exportUserSalesReport(selectedUserFilter)}
                            className="bg-[#0a4a3a] hover:bg-[#073a2e] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-600 font-sans"
                            title={`Export sales ledger for ${selectedUserFilter} as Excel`}
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-300" />
                            Export {selectedUserFilter} (Excel)
                          </button>
                        )}
                        <span className="bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1 rounded text-[10px] font-mono whitespace-nowrap">
                          Showing {filteredSalesRecords.length} of {salesRecords.length} Transactions
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                            <th className="py-3.5 px-5">Invoice Reference</th>
                            <th className="py-3.5 px-5">Date/Time Stamp</th>
                            <th className="py-3.5 px-5">Billed Medical Items</th>
                            <th className="py-3.5 px-5">Billed By</th>
                            <th className="py-3.5 px-5">Method Split (Cash / Transfer / Card)</th>
                            <th className="py-3.5 px-5 text-right">Invoice Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-mono text-slate-300">
                          {filteredSalesRecords.length > 0 ? (
                            filteredSalesRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-3.5 px-5 text-cyan-400 font-bold">{rec.id}</td>
                                <td className="py-3.5 px-5 text-slate-400 text-[11px]">{rec.timestamp}</td>
                                <td className="py-3.5 px-5 max-w-xs truncate text-slate-200 font-sans font-medium">
                                  {rec.items.map(item => `${item.productName} (x${item.quantity})`).join(", ")}
                                </td>
                                <td className="py-3.5 px-5">
                                  <span className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                                    {rec.userName || "System"}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5">
                                  <div className="flex gap-1.5 text-[10px]">
                                    <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-900">CS ₦{rec.cashPaid.toLocaleString()}</span>
                                    <span className="bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-900">TR ₦{rec.transferPaid.toLocaleString()}</span>
                                    <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900">CD ₦{rec.cardPaid.toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5 text-right font-bold text-white text-sm">
                                  ₦{rec.total.toLocaleString("en-NG")}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500">
                                <Database className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                                No clinical transactions logged for user "{selectedUserFilter}" in this active session.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 2: CLINICAL STOCK AUDITOR */}
              {superAdminTab === "stocktake" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Info card */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Clinical Stock Discrepancy Auditor
                      </h4>
                      <p className="text-xs text-slate-400">Perform physical reconciliations. Input physical shelf counts to calculate discrepancies against system records.</p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch md:self-auto bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block shrink-0">Audit Date:</label>
                      <input
                        type="date"
                        value={auditDate}
                        onChange={(e) => setAuditDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Dynamic Audit Search Bar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search clinical item by name, molecule API, or medical category..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      {auditSearchQuery && (
                        <button
                          onClick={() => setAuditSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-mono text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-800"
                          title="Clear Search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {auditSearchQuery && (
                      <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        Found <span className="text-cyan-400 font-bold">{
                          activePharmacyProducts.filter(p => {
                            const q = auditSearchQuery.toLowerCase().trim();
                            return p.name.toLowerCase().includes(q) || p.api_molecule.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                          }).length
                        }</span> matching items of interest
                      </div>
                    )}
                  </div>

                  {/* Stock Comparison Grid */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                            <th className="py-3.5 px-5">Clinical Product</th>
                            <th className="py-3.5 px-5 text-center">App Quantity</th>
                            <th className="py-3.5 px-5 text-center w-36">Physical Shelf Count</th>
                            <th className="py-3.5 px-5 text-center">Delta Indicator</th>
                            <th className="py-3.5 px-5">Discrepancy Reason / Remediation Notes (Optional)</th>
                            <th className="py-3.5 px-5 text-right">Audit Verification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {activePharmacyProducts.filter((p) => {
                            const q = auditSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            return p.name.toLowerCase().includes(q) || 
                                   p.api_molecule.toLowerCase().includes(q) || 
                                   p.category.toLowerCase().includes(q);
                          }).map((p) => {
                            const shelfInput = shelfCounts[p.id] || "";
                            const shelfCount = shelfInput === "" ? null : parseInt(shelfInput);
                            const discrepancy = shelfCount === null ? null : shelfCount - p.quantity;

                            return (
                              <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-4 px-5">
                                  <div className="font-bold text-white text-sm">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.api_molecule} | {p.category}</div>
                                </td>
                                
                                <td className="py-4 px-5 text-center text-slate-300 font-mono font-bold text-sm">
                                  {p.quantity}
                                </td>

                                <td className="py-4 px-5 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Enter physical count"
                                    value={shelfInput}
                                    onChange={(e) => setShelfCounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-center font-mono font-bold text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                  />
                                </td>

                                <td className="py-4 px-5 text-center">
                                  {discrepancy === null ? (
                                    <span className="text-slate-600 font-mono text-[11px]">—</span>
                                  ) : discrepancy === 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                                      <Check className="w-3 h-3" />
                                      Match
                                    </span>
                                  ) : discrepancy > 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-850/60 text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                                      +{discrepancy} Overstock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-rose-950/80 border border-rose-850/60 text-rose-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase animate-pulse">
                                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                                      {discrepancy} Shortage
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-5">
                                  <input
                                    type="text"
                                    placeholder="e.g., Unrecorded carton, Damaged discards..."
                                    value={discrepancyReasons[p.id] || ""}
                                    onChange={(e) => setDiscrepancyReasons(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-300 placeholder:text-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>

                                <td className="py-4 px-5 text-right">
                                  <button
                                    onClick={() => handleStockVerifyAndSync(p.id)}
                                    disabled={shelfInput === ""}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 ml-auto transition-all ${
                                      shelfInput !== ""
                                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95"
                                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Accept Count
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {activePharmacyProducts.filter((p) => {
                            const q = auditSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            return p.name.toLowerCase().includes(q) || 
                                   p.api_molecule.toLowerCase().includes(q) || 
                                   p.category.toLowerCase().includes(q);
                          }).length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                                <Search className="w-10 h-10 mx-auto text-slate-700 mb-2 animate-bounce" />
                                <div className="text-sm font-bold text-slate-400">No clinical items match your search of interest</div>
                                <p className="text-xs text-slate-600 mt-1">Try searching by brand name, generic molecule name, or clinical category</p>
                                <button
                                  onClick={() => setAuditSearchQuery("")}
                                  className="mt-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all active:scale-95"
                                >
                                  Clear Search Query
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 3: AUDIT FREQUENCIES & LOGS */}
              {superAdminTab === "frequencies" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* LEFT COLUMN: SCHEDULE AUDIT FORM - 5 cols */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="border-b border-slate-850 pb-3">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                          Audit Frequency Planner
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Schedule the recurrence rate of physical audit cycles with automatic 24-hour reminders.</p>
                      </div>
 
                      <form onSubmit={handleAddStockFrequency} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Auditing Frequency</label>
                            <select
                              value={newFreq}
                              onChange={(e) => setNewFreq(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              <option value="Daily">Daily Audit Cycle</option>
                              <option value="Weekly">Weekly Routine</option>
                              <option value="Bi-weekly">Bi-Weekly Target</option>
                              <option value="Monthly">Monthly Reconciliation</option>
                            </select>
                          </div>
 
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Recurrence Day / Date</label>
                            <input
                              type="text"
                              value={newFreqTarget}
                              onChange={(e) => setNewFreqTarget(e.target.value)}
                              placeholder="e.g. Monday, 1st of Month"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
 
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Audit Start Time</label>
                          <input
                            type="text"
                            value={newFreqTime}
                            onChange={(e) => setNewFreqTime(e.target.value)}
                            placeholder="e.g. 08:00 AM"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          />
                        </div>
 
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Audit Target Notes & Directives</label>
                          <textarea
                            rows={2}
                            value={newFreqNotes}
                            onChange={(e) => setNewFreqNotes(e.target.value)}
                            placeholder="Specify scope (e.g. Back shelf antibiotics counting before morning shift opens)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                          />
                        </div>

                        {/* 24-Hour Prior Notice Preferences */}
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3 font-sans">
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">⏰ 24h Prior Advance Reminders</span>
                          
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-300 font-medium flex items-center gap-2 select-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newFreqAppNotification}
                                onChange={(e) => setNewFreqAppNotification(e.target.checked)}
                                className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5"
                              />
                              Enable App Notice Banners
                            </label>
                            <span className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 font-mono font-semibold uppercase tracking-wider">🔔 24h PRIOR</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-slate-300 font-medium flex items-center gap-2 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newFreqEmailNotification}
                                  onChange={(e) => setNewFreqEmailNotification(e.target.checked)}
                                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5"
                                />
                                Enable Email Alerts
                              </label>
                              <span className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 font-mono font-semibold uppercase tracking-wider">✉️ 24h PRIOR</span>
                            </div>
                            
                            {newFreqEmailNotification && (
                              <div className="space-y-1 pl-5 animate-fadeIn">
                                <label className="text-[9px] text-slate-500 font-bold block">NOTIFICATION RECIPIENT EMAIL:</label>
                                <input
                                  type="email"
                                  value={newFreqEmailAddress}
                                  onChange={(e) => setNewFreqEmailAddress(e.target.value)}
                                  placeholder="e.g. administrator@gpharm.com"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                                />
                              </div>
                            )}
                          </div>
                        </div>
 
                        <button
                          type="submit"
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs p-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-cyan-500"
                        >
                          <Plus className="w-4 h-4" />
                          Activate Audit Schedule
                        </button>
                      </form>
                    </div>
 
                    {/* Active list */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h5 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Active Recurrent Schedules</h5>
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                        {activePharmacyFrequencies.length > 0 ? (
                          activePharmacyFrequencies.map((f) => (
                            <div key={f.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-850 space-y-2.5 transition-all hover:border-slate-750">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold font-mono bg-cyan-950 border border-cyan-900 text-cyan-300 px-1.5 py-0.2 rounded">{f.frequency}</span>
                                    <span className="text-xs text-slate-300 font-bold font-mono">{f.timeOfDay} on {f.targetDayOrDate}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium">{f.notes}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteFrequency(f.id)}
                                  className="text-rose-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-950 transition-all shrink-0"
                                  title="Cancel Schedule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Notification Settings badges & triggers */}
                              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                                <div className="flex flex-wrap gap-1.5">
                                  {f.enableAppNotification ? (
                                    <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-900/40 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                                      🔔 App
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 line-through">🔔 App</span>
                                  )}
                                  {f.enableEmailNotification ? (
                                    <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-medium flex items-center gap-1" title={f.notificationEmail}>
                                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                      ✉️ Email to {f.notificationEmail ? (f.notificationEmail.length > 15 ? f.notificationEmail.substring(0, 15) + "..." : f.notificationEmail) : "Default"}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 line-through">✉️ Email</span>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => triggerSimulationReminder(f)}
                                  className="bg-[#0a4a3a] hover:bg-[#073a2e] text-white px-2 py-1 rounded text-[9px] font-bold transition-all active:scale-95 flex items-center gap-1 border border-emerald-600"
                                  title="Instantly dispatch a simulated 24-hour advance notice alert"
                                >
                                  <Send className="w-2.5 h-2.5 text-cyan-300" />
                                  Test Notice (24h)
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-600 text-xs">
                            No recurrent audit frequencies configured.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
 
                  {/* RIGHT COLUMN: HISTORICAL STOCK TAKING LOGS & NOTIFICATIONS - 7 cols */}
                  <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    
                    {/* Header Tabs for Audit Ledger vs Reminder Notifications logs */}
                    <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-850">
                        <button
                          onClick={() => setFreqSubTab("history")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            freqSubTab === "history"
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          📝 Reconciliation Journal
                        </button>
                        <button
                          onClick={() => setFreqSubTab("reminders")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap relative ${
                            freqSubTab === "reminders"
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          ⏰ 24h Reminder logs
                          {reminderLogs.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold font-mono text-[8px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                              {reminderLogs.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {freqSubTab === "reminders" && reminderLogs.length > 0 && (
                        <button
                          onClick={handleClearReminderLogs}
                          className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 hover:bg-slate-850"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear Logs
                        </button>
                      )}
                    </div>
 
                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                      
                      {/* Subtab 1: Reconciliation logs */}
                      {freqSubTab === "history" && (
                        <>
                          {activePharmacyAudits.length > 0 ? (
                            activePharmacyAudits.map((audit) => {
                              const isShortage = audit.discrepancy < 0;
                              return (
                                <div key={audit.id} className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h5 className="font-bold text-slate-200 text-sm">{audit.productName}</h5>
                                      <span className="text-[9px] text-slate-400 font-mono tracking-wider">{audit.timestamp}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      audit.discrepancy === 0
                                        ? "bg-emerald-950 border border-emerald-900 text-emerald-300"
                                        : isShortage
                                          ? "bg-rose-950 border border-rose-900 text-rose-300"
                                          : "bg-amber-950 border border-amber-900 text-amber-300"
                                    }`}>
                                      {audit.discrepancy === 0
                                        ? "Verified Match"
                                        : `${audit.discrepancy > 0 ? "+" : ""}${audit.discrepancy} Variance`}
                                    </span>
                                  </div>
 
                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-lg border border-slate-850">
                                    <div>App Ledger: <span className="font-bold text-slate-300">{audit.appCount} Units</span></div>
                                    <div>Shelf Physical: <span className="font-bold text-cyan-300">{audit.shelfCount} Units</span></div>
                                  </div>
 
                                  <div className="text-xs text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                    <p className="font-medium">
                                      <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Auditor Remediation Notes</span>
                                      {audit.reason}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-16 text-slate-600">
                              <Layers className="w-12 h-12 text-slate-800 mx-auto mb-2" />
                              No stock-taking reconciliations logged yet.
                            </div>
                          )}
                        </>
                      )}

                      {/* Subtab 2: Reminder logs */}
                      {freqSubTab === "reminders" && (
                        <>
                          {reminderLogs.length > 0 ? (
                            reminderLogs.map((log) => {
                              const isApp = log.type === "app";
                              return (
                                <div key={log.id} className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2.5 transition-all hover:border-slate-800">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      {isApp ? (
                                        <div className="bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg border border-cyan-500/25">
                                          <Smartphone className="w-3.5 h-3.5" />
                                        </div>
                                      ) : (
                                        <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/25">
                                          <Mail className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-xs text-slate-400 font-mono">{log.timestamp}</span>
                                        <div className="text-xs font-bold text-slate-200 mt-0.5">{log.scheduleDetails}</div>
                                      </div>
                                    </div>

                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                      isApp 
                                        ? "bg-cyan-950/80 border border-cyan-900 text-cyan-300"
                                        : "bg-emerald-950/80 border border-emerald-900 text-emerald-300"
                                    }`}>
                                      {isApp ? "App alert banner" : "Email alert"}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850 leading-relaxed">
                                    {log.message}
                                  </div>

                                  {!isApp && log.recipient && (
                                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Recipient Mailbox: <span className="text-slate-300 font-semibold">{log.recipient}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-16 text-slate-600">
                              <Clock className="w-12 h-12 text-slate-800 mx-auto mb-2" />
                              <div className="text-sm font-bold text-slate-400">No scheduled notifications logs yet</div>
                              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">Create a schedule or click the "Test Notice" button on any active frequency to simulate immediate 24-hour prior alert dispatches.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* PANEL 4: STAFF DIRECTORY & CLEARANCES */}
              {superAdminTab === "staff" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  
                  {/* LEFT COLUMN: ADD NEW STAFF USER FORM */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="border-b border-slate-850 pb-3">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4 text-cyan-400" />
                          Add Staff Member
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Create isolated login credentials for cashiers or branch managers.
                        </p>
                      </div>

                      <form onSubmit={handleAddStaffUser} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Username / ID</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. obi"
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Security PIN (4 digits)</label>
                            <input
                              type="text"
                              maxLength={4}
                              required
                              placeholder="e.g. 1234"
                              value={newUserPin}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setNewUserPin(val);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono tracking-widest text-center font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Assign Role</label>
                            <select
                              value={newUserRole}
                              onChange={(e) => setNewUserRole(e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              <option value="cashier">Cashier Mode</option>
                              <option value="admin">Admin Mode</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">HQ / Branch Location</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ikeja Branch"
                            value={newUserLocation}
                            onChange={(e) => setNewUserLocation(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 font-sans">
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">🔒 Authorized Clearance Features</span>
                          
                          <div className="space-y-2.5">
                            {[
                              { id: "sales", label: "POS Sales Desk", desc: "Allow issuing invoices & recording payments" },
                              { id: "inventory", label: "Clinical Inventory", desc: "Allow manual price & quantity updates" },
                              { id: "audits", label: "Clinical Audit & Stocktake", desc: "Allow running stock discrepancy auditor" },
                              { id: "ai_consult", label: "AI Clinical Consultant", desc: "Access real-time Gemini pharmacovigilance consult" },
                              { id: "admin_panel", label: "Admin Clearance Hub", desc: "Access sales dashboards & reports" }
                            ].map((feat) => {
                              const isChecked = newUserFeatures.includes(feat.id);
                              return (
                                <label key={feat.id} className="flex items-start gap-2.5 select-none cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewUserFeatures([...newUserFeatures, feat.id]);
                                      } else {
                                        setNewUserFeatures(newUserFeatures.filter(f => f !== feat.id));
                                      }
                                    }}
                                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5 mt-0.5"
                                  />
                                  <div>
                                    <span className="text-xs text-slate-200 font-medium block">{feat.label}</span>
                                    <span className="text-[10px] text-slate-500 block leading-tight">{feat.desc}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#0a4a3a] hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 border border-emerald-600 shadow-md active:scale-[0.98]"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Staff Member
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ACTIVE STAFF DIRECTORY */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Active Staff Directory
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Directory of active staff with dynamic feature permissions.
                          </p>
                        </div>
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded text-[10px] font-mono">
                          {appUsers.filter(u => u.pharmacyId === currentPharmacy?.id).length} Active User(s)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                              <th className="py-3 px-4">Staff Details</th>
                              <th className="py-3 px-4 text-center">Security PIN</th>
                              <th className="py-3 px-4">Authorized Clearances</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 font-sans text-slate-300">
                            {appUsers
                              .filter(u => u.pharmacyId === currentPharmacy?.id)
                              .map((u) => {
                                const isSelf = currentUser?.id === u.id;
                                return (
                                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="py-4 px-4 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-sm text-white">{u.username}</span>
                                        {isSelf && (
                                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">YOU</span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                          u.role === "super_admin"
                                            ? "bg-purple-950 text-purple-300 border border-purple-900"
                                            : u.role === "admin"
                                              ? "bg-amber-950 text-amber-300 border border-amber-900"
                                              : "bg-emerald-950 text-emerald-300 border border-emerald-900"
                                        }`}>
                                          {u.role.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{u.location}</span>
                                      </div>
                                    </td>
                                    
                                    <td className="py-4 px-4 text-center font-mono font-bold text-cyan-400 text-sm">
                                      {u.pinCode}
                                    </td>

                                    <td className="py-4 px-4">
                                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                                        {(!u.features || u.features.length === 0) && (
                                          <span className="text-[9px] text-slate-500 italic">None</span>
                                        )}
                                        {u.features?.includes("sales") && (
                                          <span className="bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">POS</span>
                                        )}
                                        {u.features?.includes("inventory") && (
                                          <span className="bg-blue-950/60 border border-blue-900 text-blue-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">INV</span>
                                        )}
                                        {u.features?.includes("audits") && (
                                          <span className="bg-orange-950/60 border border-orange-900 text-orange-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">AUDIT</span>
                                        )}
                                        {u.features?.includes("ai_consult") && (
                                          <span className="bg-pink-950/60 border border-pink-900 text-pink-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">AI</span>
                                        )}
                                        {u.features?.includes("admin_panel") && (
                                          <span className="bg-cyan-950/60 border border-cyan-900 text-cyan-300 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">ADMIN</span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="py-4 px-4 text-right">
                                      {isSelf ? (
                                        <span className="text-[10px] font-mono text-slate-500 italic">Protected</span>
                                      ) : (
                                        <button
                                          onClick={() => handleDeleteStaffUser(u.id)}
                                          className="text-slate-400 hover:text-rose-500 p-2 rounded-xl transition-all duration-150 font-mono hover:bg-slate-900 animate-fade-in"
                                          title="Delete staff member"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ==================== PANEL 5: PHARMACY WORKSPACE PROFILE & ISOLATION ==================== */}
              {superAdminTab === "pharmacy_profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 animate-fade-in font-sans">
                  {/* LEFT COLUMN: PHARMACY DETAILS FORM */}
                  <div className="lg:col-span-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-sm text-white">Pharmacy Business Profile</h4>
                        <p className="text-[11px] text-slate-400">Update company identity, director contact info, and HQ address.</p>
                      </div>
                    </div>

                    <form onSubmit={handleSavePharmacyProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Pharmacy Brand Name</label>
                        <input
                          type="text"
                          required
                          value={editPharmName}
                          onChange={(e) => setEditPharmName(e.target.value)}
                          placeholder="e.g. MedPlus Pharmacy Lagos"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Managing Director / Superintendent Pharmacist</label>
                        <input
                          type="text"
                          value={editPharmDirector}
                          onChange={(e) => setEditPharmDirector(e.target.value)}
                          placeholder="e.g. Pharm. Chidi Okafor"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Official Phone Contact</label>
                          <input
                            type="text"
                            value={editPharmPhone}
                            onChange={(e) => setEditPharmPhone(e.target.value)}
                            placeholder="e.g. +234 803 000 1122"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Official Email Address</label>
                          <input
                            type="email"
                            value={editPharmEmail}
                            onChange={(e) => setEditPharmEmail(e.target.value)}
                            placeholder="e.g. info@gpharm.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Headquarter / Primary Location Address</label>
                        <input
                          type="text"
                          value={editPharmLocation}
                          onChange={(e) => setEditPharmLocation(e.target.value)}
                          placeholder="e.g. Victoria Island, Lagos"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] border border-cyan-500"
                      >
                        <Check className="w-4 h-4" />
                        Save Profile Changes
                      </button>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: MULTI-TENANT ISOLATION ARCHITECTURE DISPLAY */}
                  <div className="lg:col-span-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-sm text-white">Database Tenant Isolation Status</h4>
                        <p className="text-[11px] text-slate-400">Strict cryptographically partitioned cloud & local data separation.</p>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Active Pharmacy ID:</span>
                        <span className="text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                          {currentPharmacy?.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Data Partitioning:</span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Isolated Tenant Context
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Cloud Database Sync:</span>
                        <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 text-[10px]">
                          Filtered by pharmacyId
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        Multi-Pharmacy Data Security Guarantee
                      </h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        All sales records, clinical stock inventory, audit logs, and user credentials saved under <strong className="text-white">{currentPharmacy?.name}</strong> are tagged exclusively with workspace ID <code className="text-cyan-300 font-mono text-[10px]">{currentPharmacy?.id}</code>. Other pharmacies logged into this application cannot view, edit, or access your data in memory, storage, or cloud database queries.
                      </p>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Registered Pharmacy Workspaces</span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {pharmacies.map(p => (
                          <div
                            key={p.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between font-sans transition-all ${
                              p.id === currentPharmacy?.id
                                ? "bg-slate-950 border-cyan-500/50 text-white"
                                : "bg-slate-950/50 border-slate-800 text-slate-400"
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                {p.name}
                                {p.id === currentPharmacy?.id && (
                                  <span className="bg-cyan-500/20 text-cyan-300 text-[8px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/30">CURRENT</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{p.location || "Lagos HQ"}</div>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">{p.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* 4. Master Inventory Manager (Manual + Bulk Upload) */}
        {(currentRole === "admin" || currentRole === "super_admin") && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="bg-[#0a4a3a] text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Clinical Inventory Spreadsheet</h2>
              <p className="text-xs text-emerald-200/80">Monitor pharmacy quantities, adjust prices, and upload master schedules.</p>
            </div>
            
            {/* Interactive forms tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadDemoExcel}
                className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Get Upload Template
              </button>

              <button
                onClick={exportCurrentStock}
                className="bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-emerald-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                title="Export entire current stock as Excel"
              >
                <Download className="w-4 h-4" />
                Export Stock (Excel)
              </button>

              <label className="bg-[#126350] hover:bg-emerald-800 border border-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-md">
                <Upload className="w-4 h-4" />
                Bulk Excel Import
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-white text-[#0a4a3a] hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4.5 h-4.5" />
                Add Single Medicine
              </button>
            </div>
          </div>

          {/* Database Log Ticker */}
          <div className="bg-slate-900 text-emerald-400 px-6 py-2.5 font-mono text-[10px] flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">LOG</span>
              <span className="text-slate-300 truncate">{dbLogs[0] || "Ready for POS operations."}</span>
            </div>
            <span className="text-slate-500 shrink-0 font-bold ml-2">GPharm Node Core Online</span>
          </div>

          {/* Inventory Financial & Stock Metrics Summary Bar */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Products */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-0.5">Total Inventory Products</span>
                <div className="text-lg font-bold text-white font-mono flex items-baseline gap-1.5">
                  <span>{inventoryMetrics.totalProductsCount}</span>
                  <span className="text-xs text-emerald-400 font-sans font-medium">Medicines</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  {inventoryMetrics.totalUnitsCount.toLocaleString("en-NG")} total units in stock
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Total Inventory Cost */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-0.5">Total Inventory Cost</span>
                <div className="text-lg font-bold text-amber-400 font-mono">
                  ₦{inventoryMetrics.totalCostValue.toLocaleString("en-NG")}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Total purchasing cost of inventory
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            {/* Total Sales Value */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-0.5">Total Sales Value</span>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  ₦{inventoryMetrics.totalSalesValue.toLocaleString("en-NG")}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Expected revenue at selling price
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Potential Profit */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-0.5">Potential Profit</span>
                <div className="text-lg font-bold text-cyan-400 font-mono">
                  ₦{inventoryMetrics.totalPotentialProfit.toLocaleString("en-NG")}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  Net margin across inventory
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Master Inventory Search & Display Control Bar */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3 font-sans">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Prominent Wide Search Bar */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={masterInventorySearchQuery}
                  onChange={(e) => setMasterInventorySearchQuery(e.target.value)}
                  placeholder="🔍 Search inventory by Brand Name, API Molecule, Category, or Drug Type..."
                  className="w-full bg-slate-950 border-2 border-emerald-500/70 focus:border-emerald-400 rounded-xl pl-11 pr-10 py-3 text-sm text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
                />
                {masterInventorySearchQuery && (
                  <button
                    onClick={() => setMasterInventorySearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full transition-all"
                    title="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Toggle button / count indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAllInventory(!showAllInventory)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-md ${
                    showAllInventory || masterInventorySearchQuery.trim() !== ""
                      ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-300" />
                  {showAllInventory || masterInventorySearchQuery.trim() !== ""
                    ? `Viewing Full Inventory (${activePharmacyProducts.length} items)`
                    : `Show Full Inventory (${activePharmacyProducts.length} items)`}
                </button>
              </div>
            </div>

            {masterInventorySearchQuery.trim() && (
              <div className="text-xs text-emerald-400 font-mono flex items-center justify-between px-1">
                <span>Search matches for "<strong className="text-white">{masterInventorySearchQuery}</strong>":</span>
                <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  {filteredInventoryProducts.length} results found
                </span>
              </div>
            )}
          </div>

          {/* Master Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-mono tracking-wider">
                  <th className="py-4 px-6 font-bold">Medicine Brand Name</th>
                  <th className="py-4 px-6 font-bold">API Molecule / Ingredient</th>
                  <th className="py-4 px-6 font-bold">Category</th>
                  <th className="py-4 px-6 font-bold">Selling & Cost Price</th>
                  <th className="py-4 px-6 font-bold">Stock Status</th>
                  <th className="py-4 px-6 font-bold">Expiry</th>
                  <th className="py-4 px-6 font-bold">POM Req?</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="inventory-tbody" className="divide-y divide-slate-100 font-sans">
                {filteredInventoryProducts.length > 0 ? (
                  filteredInventoryProducts.map((p) => {
                    const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 10;
                    const isLowStock = p.quantity <= threshold;
                    const isOutOfStock = p.quantity <= 0;
                    const costVal = p.cost_price !== undefined && p.cost_price !== null && !isNaN(p.cost_price)
                      ? p.cost_price
                      : Math.round((p.price || 0) * 0.7);
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          isOutOfStock 
                            ? "bg-slate-100/50" 
                            : isLowStock 
                              ? "bg-rose-50/40 text-red-950 font-semibold" 
                              : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                            <span>{p.name}</span>
                            {p.drug_type && (
                              <span className="bg-[#0a4a3a]/10 text-[#0a4a3a] px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider">
                                {p.drug_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-600">{p.api_molecule}</td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono">
                          <div className="font-bold text-[#0a4a3a] text-sm">
                            ₦{p.price.toLocaleString("en-NG")}
                            <span className="text-[10px] text-slate-400 font-sans font-normal ml-1">Sell</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Cost: ₦{costVal.toLocaleString("en-NG")}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {isOutOfStock ? (
                            <span className="text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full font-bold inline-block">
                              OUT OF STOCK (Min: {threshold})
                            </span>
                          ) : isLowStock ? (
                            <span className="text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full font-bold inline-block animate-pulse">
                              CRITICAL LOW: {p.quantity} left (Min: {threshold})
                            </span>
                          ) : (
                            <span className="text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-bold inline-block">
                              {p.quantity} Units (Min: {threshold})
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {p.expiry_month && p.expiry_year ? (
                            <span className="font-mono font-bold text-slate-700 bg-amber-50 text-amber-850 px-2 py-1 rounded border border-amber-200">
                              {String(p.expiry_month).padStart(2, "0")}/{p.expiry_year}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {p.pom ? (
                            <span className="bg-red-600 text-white font-mono font-bold px-2 py-0.5 rounded text-[9px]">
                              POM
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px]">OTC</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* Stock increment for quick manual audit */}
                            <button
                              onClick={async () => {
                                const newQty = p.quantity + 10;
                                const list = products.map(item => item.id === p.id ? { ...item, quantity: newQty } : item);
                                await saveProductsList(list);
                                if (dbStatus === "connected" && supabase) {
                                  try {
                                    await supabase.from("pharmacy_inventory").update({ quantity: newQty }).eq("id", p.id);
                                    addLog(`Quick Audit: added +10 units of ${p.name}`);
                                  } catch (err) {
                                    addLog(`Offline Quick Audit: added +10 units of ${p.name} locally. Sync pending.`);
                                  }
                                } else {
                                  addLog(`Quick Audit: added +10 units of ${p.name} locally. Sync pending.`);
                                }
                              }}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-lg"
                              title="Restock +10"
                            >
                              +10
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${p.name} from inventory?`)) {
                                  const list = products.filter(item => item.id !== p.id);
                                  await saveProductsList(list);

                                  // Track deleted ID in offline cache for sync
                                  const savedDeleted = localStorage.getItem("pocket_deleted_product_ids");
                                  let deletedIds: string[] = [];
                                  if (savedDeleted) {
                                    try { deletedIds = JSON.parse(savedDeleted); } catch {}
                                  }
                                  if (!deletedIds.includes(p.id)) {
                                    deletedIds.push(p.id);
                                    localStorage.setItem("pocket_deleted_product_ids", JSON.stringify(deletedIds));
                                  }

                                  if (dbStatus === "connected" && supabase) {
                                    try {
                                      await supabase.from("pharmacy_inventory").delete().eq("id", p.id);
                                      addLog(`Deleted inventory record: ${p.name}`);
                                      // Remove from deleted offline cache on success
                                      const updatedDeleted = deletedIds.filter(id => id !== p.id);
                                      if (updatedDeleted.length > 0) {
                                        localStorage.setItem("pocket_deleted_product_ids", JSON.stringify(updatedDeleted));
                                      } else {
                                        localStorage.removeItem("pocket_deleted_product_ids");
                                      }
                                    } catch (err) {
                                      addLog(`Offline mode: Deleted ${p.name} locally. Sync pending.`);
                                    }
                                  } else {
                                    addLog(`Deleted inventory record: ${p.name}. Sync pending.`);
                                  }
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 p-1.5 rounded-lg"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-bold">Database Empty</p>
                      <p className="text-xs">No medical inventory data found. Import an Excel spreadsheet to begin.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          </section>
        )}

      </main>

      {/* --- Add Medicine Modal --- */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-[#0a4a3a] text-white p-5 sm:p-6 flex justify-between items-start">
              <div>
                <h3 className="font-display font-bold text-lg">Add New Product to Pocket Pharmacy</h3>
                <p className="text-emerald-200 text-xs">Fill clinical parameters to update stock lists instantly.</p>
              </div>
              <button 
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-emerald-200 hover:text-white bg-emerald-900/50 p-1.5 rounded-lg transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualFormSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Brand / Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Active Molecule (API) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    {manualForm.api_molecule && (
                      <button
                        type="button"
                        onClick={() => setManualForm({ ...manualForm, api_molecule: "" })}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5"
                        title="Wipe API value"
                      >
                        <X className="w-2.5 h-2.5" /> Wipe API
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Co-amoxiclav (optional)"
                      value={manualForm.api_molecule}
                      onChange={(e) => setManualForm({ ...manualForm, api_molecule: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900"
                    />
                    {manualForm.api_molecule && (
                      <button
                        type="button"
                        onClick={() => setManualForm({ ...manualForm, api_molecule: "" })}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-all"
                        title="Wipe API"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Suggested API match banner if name matches system drug knowledge */}
              {suggestedApiForInput && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs animate-fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-900 truncate">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">
                      Suggested API for <strong>{manualForm.name}</strong>: <code className="bg-emerald-100 text-emerald-950 font-bold px-1.5 py-0.5 rounded font-mono">{suggestedApiForInput}</code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualForm(prev => ({ ...prev, api_molecule: suggestedApiForInput }))}
                    className="bg-[#0a4a3a] hover:bg-[#073a2e] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 shadow-xs"
                  >
                    Apply API
                  </button>
                </div>
              )}

              {/* Related Drugs & APIs in Category Selector */}
              {categoryRelatedList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#0a4a3a]" />
                      Related Drugs & APIs ({manualForm.category})
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-normal">Click to auto-fill</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {categoryRelatedList.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setManualForm({
                          ...manualForm,
                          name: item.name,
                          api_molecule: item.api,
                          category: item.category || manualForm.category
                        })}
                        className="text-[10px] bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-[#0a4a3a] px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1 text-left shadow-2xs"
                      >
                        <span className="font-semibold">{item.name}</span>
                        {item.api && (
                          <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded">
                            {item.api}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Wholesale Category</label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900"
                  >
                    {DRUG_CATEGORIES.filter(c => c !== "All Categories").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Drug Type / Formulation</label>
                  <select
                    value={manualForm.drug_type}
                    onChange={(e) => setManualForm({ ...manualForm, drug_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900"
                  >
                    {DRUG_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section: Cost Price vs Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                    <span>Unit Cost Price (₦)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Purchase Cost</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 13000"
                    value={manualForm.cost_price}
                    onChange={(e) => setManualForm({ ...manualForm, cost_price: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0a4a3a] block flex items-center justify-between">
                    <span>Unit Selling Price (₦)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Retail / Wholesale</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 18500"
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Low Stock Threshold</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={manualForm.low_stock_threshold}
                    onChange={(e) => setManualForm({ ...manualForm, low_stock_threshold: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pom"
                  checked={manualForm.pom}
                  onChange={(e) => setManualForm({ ...manualForm, pom: e.target.checked })}
                  className="w-4 h-4 text-[#0a4a3a] focus:ring-[#0a4a3a] border-slate-300 rounded"
                />
                <label htmlFor="pom" className="text-xs font-bold text-red-700 cursor-pointer select-none">
                  Requires POM prescription Verification?
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Expiry Month</label>
                  <select
                    value={manualForm.expiry_month}
                    onChange={(e) => setManualForm({ ...manualForm, expiry_month: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')} - {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Expiry Year</label>
                  <input
                    type="number"
                    required
                    min={2026}
                    max={2040}
                    placeholder="e.g. 2027"
                    value={manualForm.expiry_year}
                    onChange={(e) => setManualForm({ ...manualForm, expiry_year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0a4a3a] text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0a4a3a] hover:bg-[#073a2e] text-white px-5 py-2 rounded-xl font-bold transition-all shadow-md"
                >
                  Save Product Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- Digital Receipt Modal --- */}
      {isReceiptModalOpen && lastReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 text-slate-900 font-mono"
          >
            <div className="bg-[#0a4a3a] text-white p-6 text-center">
              <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-emerald-300 stroke-[3px]" />
              </div>
              <h3 className="font-display font-bold text-lg">Transaction Receipt</h3>
              <p className="text-emerald-200 text-xs">Pocket Pharmacy • POS Terminal</p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span>Receipt ID:</span>
                <span className="font-bold">{lastReceipt.receiptId}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span>Timestamp:</span>
                <span className="font-bold">{lastReceipt.timestamp}</span>
              </div>

              {/* Items */}
              <div className="space-y-2 py-2">
                <div className="font-bold uppercase text-slate-500 border-b border-slate-100 pb-1">Items Billed</div>
                {lastReceipt.cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>{item.product.name} (x{item.quantity})</span>
                    <span className="font-bold">₦{(item.product.price * item.quantity).toLocaleString("en-NG")}</span>
                  </div>
                ))}
              </div>

              {/* Payments breakdown */}
              <div className="space-y-1 pt-2 border-t border-dashed border-slate-200">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL BILL AMOUNT:</span>
                  <span>₦{lastReceipt.total.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cash Paid:</span>
                  <span>₦{lastReceipt.cashPaid.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Transfer Paid:</span>
                  <span>₦{lastReceipt.transferPaid.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Card POS Paid:</span>
                  <span>₦{lastReceipt.cardPaid.toLocaleString("en-NG")}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 pt-1">
                  <span>CHANGE DISPENSED:</span>
                  <span>₦{lastReceipt.change.toLocaleString("en-NG")}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                <p>Thank you for your clinical B2B purchase!</p>
                <p className="mt-1">Verified with Pocket Pharmacy Security Protocols</p>
              </div>

              {/* Receipt Action Center */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 font-sans">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">📲 Digital Receipt Delivery</span>
                
                {/* SMS Section */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 font-bold block">PHONE NUMBER (FOR SMS TEXT):</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="e.g. +234 803 123 4567"
                      value={smsPhoneNumber}
                      onChange={(e) => setSmsPhoneNumber(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0a4a3a]"
                    />
                    <button
                      onClick={() => {
                        if (!smsPhoneNumber.trim()) {
                          alert("⚠️ Please enter a valid telephone number.");
                          return;
                        }
                        setSmsSentStatus("sending");
                        setTimeout(() => {
                          setSmsSentStatus("sent");
                          alert(`✅ SMS Receipt generated and dispatched successfully to ${smsPhoneNumber}!\n\nPayload:\n${smsPreviewText}`);
                        }, 1200);
                      }}
                      disabled={smsSentStatus === "sending" || !smsPhoneNumber.trim()}
                      className="bg-[#0a4a3a] hover:bg-[#073a2e] text-white disabled:bg-slate-200 disabled:text-slate-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95 shrink-0"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {smsSentStatus === "sending" ? "Sending..." : smsSentStatus === "sent" ? "Resend" : "Send SMS"}
                    </button>
                  </div>
                  {smsSentStatus === "sent" && (
                    <div className="bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded border border-emerald-100 mt-1 font-sans font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Receipt SMS message safely routed to GSM networks.
                    </div>
                  )}
                </div>

                {/* PDF/Share section */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">PDF FILE / SOCIAL SHARING:</span>
                  <button
                    onClick={() => {
                      // Generate and download receipt text as virtual PDF mockup file
                      const blob = new Blob([smsPreviewText], { type: "text/plain;charset=utf-8" });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `Pocket_Pharmacy_Receipt_${lastReceipt.receiptId}.txt`;
                      link.click();
                      addLog(`Virtual PDF receipt download initiated for ${lastReceipt.receiptId}`);
                      
                      // Also call sharing API if available in standard devices
                      if (navigator.share) {
                        navigator.share({
                          title: `Pocket Pharmacy Receipt ${lastReceipt.receiptId}`,
                          text: smsPreviewText
                        }).catch(() => {});
                      } else {
                        alert(`📝 Receipt text formatted for PDF download and offline social sharing.\n\nFile: Pocket_Pharmacy_Receipt_${lastReceipt.receiptId}.txt downloaded!`);
                      }
                    }}
                    className="bg-slate-900 text-slate-200 hover:bg-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all active:scale-95 border border-slate-700"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    Share PDF / TXT
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    alert("🖨️ Thermal printer handshake initiated.");
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-3 rounded-xl transition-all"
                >
                  Thermal Print
                </button>
                <button
                  onClick={() => {
                    // Reset SMS states when closing
                    setIsReceiptModalOpen(false);
                    setSmsPhoneNumber("");
                    setSmsSentStatus("idle");
                  }}
                  className="flex-1 bg-[#0a4a3a] hover:bg-[#073a2e] text-white font-bold p-3 rounded-xl transition-all shadow"
                >
                  Dismiss Receipt
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
