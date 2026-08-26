import { Pharmacy, AppUser, Product, StockFrequency } from "../types";

export const DEFAULT_PHARMACY: Pharmacy = {
  id: "pocket-pharmacy-hq",
  name: "Pocket Pharmacy Headquarters",
  directorName: "Dr. Michael Onyeka",
  location: "Victoria Island, Lagos, Nigeria",
  phone: "+234 803 123 4567",
  email: "admin@pocketpharmacy.com",
  cacNumber: "RC-1984210",
  pcnLicense: "PCN/REG/2026/0491",
  currency: "₦",
  createdAt: "2026-01-01T00:00:00.000Z",
  superAdminId: "user-super-1"
};

export const DEFAULT_SUPER_ADMIN: AppUser = {
  id: "user-super-1",
  username: "michael_superadmin",
  fullName: "Dr. Michael Onyeka",
  role: "super_admin",
  pin: "super12",
  email: "onyemekamichael@gmail.com",
  phone: "+234 803 123 4567",
  pharmacyId: "pocket-pharmacy-hq",
  accessibleFeatures: ["sales", "inventory", "audits", "ai_consult", "admin_panel"],
  createdAt: "2026-01-01T00:00:00.000Z"
};

export const DEFAULT_USERS: AppUser[] = [
  DEFAULT_SUPER_ADMIN,
  {
    id: "user-admin-1",
    username: "folake_admin",
    fullName: "Pharm. Folake Adeyemi",
    role: "admin",
    pin: "folake1",
    email: "folake@pocketpharmacy.com",
    phone: "+234 802 345 6789",
    pharmacyId: "pocket-pharmacy-hq",
    accessibleFeatures: ["sales", "inventory", "audits", "ai_consult", "admin_panel"],
    createdAt: "2026-01-05T00:00:00.000Z"
  },
  {
    id: "user-cashier-1",
    username: "emeka_cashier",
    fullName: "Emeka Obi (Cashier)",
    role: "cashier",
    pin: "emeka12",
    email: "emeka@pocketpharmacy.com",
    phone: "+234 805 678 9012",
    pharmacyId: "pocket-pharmacy-hq",
    accessibleFeatures: ["sales"],
    createdAt: "2026-01-10T00:00:00.000Z"
  }
];

export const INITIAL_PRODUCTS_TEMPLATE = (pharmacyId: string): Product[] => [
  {
    id: "prod-1",
    name: "Amoxil 500mg",
    api_molecule: "Amoxicillin",
    category: "Antibiotics",
    price: 4500,
    cost_price: 3150,
    quantity: 24,
    pom: true,
    low_stock_threshold: 15,
    expiry_month: 11,
    expiry_year: 2026,
    drug_type: "Capsule",
    pharmacyId
  },
  {
    id: "prod-2",
    name: "Panadol Extra",
    api_molecule: "Paracetamol / Caffeine",
    category: "Analgesics",
    price: 1200,
    cost_price: 840,
    quantity: 150,
    pom: false,
    low_stock_threshold: 30,
    expiry_month: 12,
    expiry_year: 2027,
    drug_type: "Tablet",
    pharmacyId
  },
  {
    id: "prod-3",
    name: "Augmentin 625mg",
    api_molecule: "Co-amoxiclav",
    category: "Antibiotics",
    price: 18500,
    cost_price: 13000,
    quantity: 8,
    pom: true,
    low_stock_threshold: 12,
    expiry_month: 8,
    expiry_year: 2026,
    drug_type: "Tablet",
    pharmacyId
  },
  {
    id: "prod-4",
    name: "Lonart DS",
    api_molecule: "Artemether / Lumefantrine",
    category: "Antimalarials",
    price: 2500,
    cost_price: 1750,
    quantity: 55,
    pom: false,
    low_stock_threshold: 20,
    expiry_month: 10,
    expiry_year: 2027,
    drug_type: "Tablet",
    pharmacyId
  },
  {
    id: "prod-5",
    name: "Rocephin 1g Injection",
    api_molecule: "Ceftriaxone",
    category: "Antibiotics",
    price: 9000,
    cost_price: 6300,
    quantity: 4,
    pom: true,
    low_stock_threshold: 10,
    expiry_month: 9,
    expiry_year: 2026,
    drug_type: "Injection",
    pharmacyId
  },
  {
    id: "prod-6",
    name: "Ventolin Inhaler",
    api_molecule: "Salbutamol",
    category: "Inhalers & Respiratory",
    price: 7200,
    cost_price: 5040,
    quantity: 35,
    pom: true,
    low_stock_threshold: 10,
    expiry_month: 4,
    expiry_year: 2027,
    drug_type: "Inhaler",
    pharmacyId
  },
  {
    id: "prod-7",
    name: "Glucophage 500mg",
    api_molecule: "Metformin",
    category: "Antidiabetics",
    price: 3800,
    cost_price: 2660,
    quantity: 42,
    pom: true,
    low_stock_threshold: 15,
    expiry_month: 5,
    expiry_year: 2027,
    drug_type: "Tablet",
    pharmacyId
  },
  {
    id: "prod-8",
    name: "Lipitor 20mg",
    api_molecule: "Atorvastatin",
    category: "Antihypertensives & Cardio",
    price: 12500,
    cost_price: 8750,
    quantity: 18,
    pom: true,
    low_stock_threshold: 15,
    expiry_month: 7,
    expiry_year: 2026,
    drug_type: "Tablet",
    pharmacyId
  },
  {
    id: "prod-9",
    name: "Gaviscon Suspension 250ml",
    api_molecule: "Sodium Alginate / Antacid",
    category: "Antacids & Gastro",
    price: 5000,
    cost_price: 3500,
    quantity: 12,
    pom: false,
    low_stock_threshold: 5,
    expiry_month: 3,
    expiry_year: 2027,
    drug_type: "Suspension",
    pharmacyId
  },
  {
    id: "prod-10",
    name: "Ventolin Nebules 2.5mg",
    api_molecule: "Salbutamol",
    category: "Inhalers & Respiratory",
    price: 8000,
    cost_price: 5600,
    quantity: 3,
    pom: true,
    low_stock_threshold: 8,
    expiry_month: 12,
    expiry_year: 2026,
    drug_type: "Other",
    pharmacyId
  }
];

export const INITIAL_FREQUENCIES_TEMPLATE = (pharmacyId: string): StockFrequency[] => [
  {
    id: "SF-1",
    frequency: "Weekly",
    targetDayOrDate: "Monday",
    timeOfDay: "08:00 AM",
    notes: "Weekly routine morning stock audit",
    pharmacyId,
    enableAppReminder: true,
    enableEmailReminder: true,
    notificationEmail: "admin@pocketpharmacy.com"
  },
  {
    id: "SF-2",
    frequency: "Monthly",
    targetDayOrDate: "1st day of month",
    timeOfDay: "06:00 PM",
    notes: "End of month pharmacy stock reconciliation",
    pharmacyId,
    enableAppReminder: true,
    enableEmailReminder: true,
    notificationEmail: "admin@pocketpharmacy.com"
  }
];

export const DRUG_CATEGORIES = [
  "All Categories",
  "Antibiotics",
  "Analgesics",
  "Antimalarials",
  "Antihypertensives & Cardio",
  "Antidiabetics",
  "Inhalers & Respiratory",
  "Antacids & Gastro",
  "Vitamins & Supplements",
  "Dermatologicals",
  "Other"
];

export const DRUG_TYPES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Injection",
  "Inhaler",
  "Cream",
  "Drop",
  "Other"
];
