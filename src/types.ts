export type UserRole = "cashier" | "admin" | "super_admin";

export type FeaturePermission = "sales" | "inventory" | "audits" | "ai_consult" | "admin_panel";

export interface Pharmacy {
  id: string; // Tenant ID
  name: string;
  directorName: string;
  location: string;
  phone: string;
  email: string;
  cacNumber?: string;
  pcnLicense?: string;
  currency: string;
  createdAt: string;
  superAdminId: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  pin: string;
  email: string;
  phone?: string;
  pharmacyId: string; // Linked tenant
  accessibleFeatures?: FeaturePermission[];
  createdAt: string;
  lastActive?: string;
}

export interface Product {
  id: string;
  name: string;
  api_molecule: string;
  category: string;
  price: number;
  cost_price: number;
  quantity: number;
  pom: boolean;
  low_stock_threshold: number;
  expiry_month: number;
  expiry_year: number;
  drug_type: "Tablet" | "Syrup" | "Injection" | "Capsule" | "Suspension" | "Inhaler" | "Cream" | "Drop" | "Other";
  pharmacyId: string;
  batchNumber?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  timestamp: string;
  items: CartItem[];
  total: number;
  cashPaid: number;
  transferPaid: number;
  cardPaid: number;
  changeDue: number;
  cashierName: string;
  pharmacyId: string;
  customerPhone?: string;
  customerName?: string;
  paymentMethod: "Cash" | "Transfer" | "Card" | "Split";
}

export interface StockAuditRecord {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  shelfCount: number;
  discrepancy: number; // shelfCount - previousQuantity
  auditorName: string;
  pharmacyId: string;
  notes?: string;
}

export interface StockFrequency {
  id: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "Bi-Weekly" | "Quarterly";
  targetDayOrDate: string;
  timeOfDay: string;
  notes: string;
  pharmacyId: string;
  enableAppReminder?: boolean;
  enableEmailReminder?: boolean;
  notificationEmail?: string;
  lastSimulatedNotice?: string;
}

export interface AuditScheduleLog {
  id: string;
  timestamp: string;
  scheduleId: string;
  scheduleDetails: string;
  type: "app" | "email";
  message: string;
  recipient?: string;
  pharmacyId: string;
}

export interface ReceiptData {
  receiptId: string;
  date: string;
  items: CartItem[];
  total: number;
  cashPaid: number;
  transferPaid: number;
  cardPaid: number;
  change: number;
  cashier: string;
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyLocation: string;
}

export interface TenantSnapshot {
  pharmacy: Pharmacy;
  users: AppUser[];
  products: Product[];
  sales: SaleRecord[];
  audits: StockAuditRecord[];
  frequencies: StockFrequency[];
  logs: AuditScheduleLog[];
  lastBackup: string;
}

export type ToastType = "success" | "upload" | "checkout" | "product_added" | "info" | "warning" | "error";

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  details?: {
    productName?: string;
    quantity?: number;
    price?: number;
    receiptId?: string;
    totalAmount?: number;
    itemsCount?: number;
    fileName?: string;
    count?: number;
    paymentMethod?: string;
    timestamp?: string;
  };
  durationMs?: number;
}
