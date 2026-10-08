import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Banknote,
  ArrowRight,
  ClipboardCheck,
  Calendar,
  Clock,
  Users,
  Building2,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Send,
  Bell,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  Check,
  X,
  FileText,
  KeyRound
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "../context/ToastContext";
import {
  Pharmacy,
  AppUser,
  Product,
  SaleRecord,
  StockAuditRecord,
  StockFrequency,
  AuditScheduleLog,
  FeaturePermission
} from "../types";
import { PocketPharmacyLogo } from "./PocketPharmacyLogo";

interface SuperAdminDashboardProps {
  currentPharmacy: Pharmacy;
  currentUser: AppUser | null;
  products: Product[];
  salesRecords: SaleRecord[];
  auditRecords: StockAuditRecord[];
  frequencies: StockFrequency[];
  auditLogs: AuditScheduleLog[];
  staffUsers: AppUser[];
  lastBackupTime: string | null;
  isBackingUp: boolean;
  onManualBackup: () => void;
  onUpdatePharmacy: (pharmacy: Pharmacy) => void;
  onCreateUser: (userData: {
    username: string;
    fullName: string;
    role: "cashier" | "admin" | "super_admin";
    pin: string;
    email: string;
    phone?: string;
    accessibleFeatures?: FeaturePermission[];
  }) => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateProductStock: (productId: string, newStock: number, discrepancyNotes: string) => void;
  onAddFrequency: (freq: Omit<StockFrequency, "id" | "pharmacyId">) => void;
  onDeleteFrequency: (freqId: string) => void;
  onDispatchReminderTest: (freq: StockFrequency) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentPharmacy,
  currentUser,
  products,
  salesRecords,
  auditRecords,
  frequencies,
  auditLogs,
  staffUsers,
  lastBackupTime,
  isBackingUp,
  onManualBackup,
  onUpdatePharmacy,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateProductStock,
  onAddFrequency,
  onDeleteFrequency,
  onDispatchReminderTest
}) => {
  const { notifySuccess, notifyError } = useToast();
  const [activeAdminTab, setActiveAdminTab] = useState<
    "sales" | "auditor" | "staff" | "workspace"
  >("sales");

  // Sales filters
  const [salesSearch, setSalesSearch] = useState("");
  const [salesPaymentFilter, setSalesPaymentFilter] = useState("All");

  // Stock Audit Form state
  const [selectedAuditProductId, setSelectedAuditProductId] = useState<string>(products[0]?.id || "");
  const [physicalShelfCount, setPhysicalShelfCount] = useState<string>("");
  const [auditNotes, setAuditNotes] = useState<string>("");
  const [auditMessage, setAuditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [newStaffFullName, setNewStaffFullName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"cashier" | "admin" | "super_admin">("cashier");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [staffError, setStaffError] = useState<string | null>(null);

  // Edit Staff Modal State (Password & Details editing by Super Admin)
  const [editingStaff, setEditingStaff] = useState<AppUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"cashier" | "admin" | "super_admin">("cashier");
  const [editPin, setEditPin] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Password visibility state map for staff cards
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleOpenEditStaff = (user: AppUser) => {
    setEditingStaff(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPin(user.pin);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditError(null);
    setEditSuccessMsg(null);
  };

  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);

    const cleanPass = editPin.trim();
    if (cleanPass.length < 6 || cleanPass.length > 8) {
      setEditError("Staff password must be between 6 and 8 characters in length.");
      return;
    }

    if (!editFullName.trim() || !editUsername.trim() || !editEmail.trim()) {
      setEditError("Please provide Full Name, Username, and Email.");
      return;
    }

    onUpdateUser({
      ...editingStaff,
      fullName: editFullName.trim(),
      username: editUsername.toLowerCase().trim(),
      role: editRole,
      pin: cleanPass,
      email: editEmail.trim(),
      phone: editPhone.trim() || undefined
    });

    setEditSuccessMsg("Staff credentials and password updated successfully!");
    notifySuccess("Staff Profile Updated", `${editFullName} details saved.`);
    setTimeout(() => {
      setEditingStaff(null);
      setEditSuccessMsg(null);
    }, 1200);
  };

  // New Frequency Form State
  const [isAddFreqOpen, setIsAddFreqOpen] = useState(false);
  const [freqType, setFreqType] = useState<StockFrequency["frequency"]>("Weekly");
  const [freqDay, setFreqDay] = useState("Monday");
  const [freqTime, setFreqTime] = useState("08:00 AM");
  const [freqNotes, setFreqNotes] = useState("");
  const [freqEmail, setFreqEmail] = useState(currentPharmacy.email || "");
  const [freqAppAlert, setFreqAppAlert] = useState(true);
  const [freqEmailAlert, setFreqEmailAlert] = useState(true);

  // Workspace Profile State
  const [profileName, setProfileName] = useState(currentPharmacy.name);
  const [profileDirector, setProfileDirector] = useState(currentPharmacy.directorName);
  const [profileLocation, setProfileLocation] = useState(currentPharmacy.location);
  const [profilePhone, setProfilePhone] = useState(currentPharmacy.phone);
  const [profileEmail, setProfileEmail] = useState(currentPharmacy.email);
  const [profileCac, setProfileCac] = useState(currentPharmacy.cacNumber || "");
  const [profilePcn, setProfilePcn] = useState(currentPharmacy.pcnLicense || "");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Sales metrics
  const salesMetrics = useMemo(() => {
    const totalRevenue = salesRecords.reduce((acc, s) => acc + s.total, 0);
    const totalCash = salesRecords.reduce((acc, s) => acc + s.cashPaid, 0);
    const totalTransfer = salesRecords.reduce((acc, s) => acc + s.transferPaid, 0);
    const totalCard = salesRecords.reduce((acc, s) => acc + s.cardPaid, 0);
    return { totalRevenue, totalCash, totalTransfer, totalCard, count: salesRecords.length };
  }, [salesRecords]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return salesRecords.filter((s) => {
      const matchesSearch =
        !salesSearch ||
        s.cashierName.toLowerCase().includes(salesSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(salesSearch.toLowerCase()) ||
        s.items.some((i) => i.product.name.toLowerCase().includes(salesSearch.toLowerCase()));
      const matchesPayment =
        salesPaymentFilter === "All" || s.paymentMethod === salesPaymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [salesRecords, salesSearch, salesPaymentFilter]);

  // Stock audit handler
  const handleApplyAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditProductId) {
      setAuditMessage({ type: "error", text: "Please select a product to audit." });
      notifyError("Audit Incomplete", "Please select a product to audit.");
      return;
    }
    const count = parseInt(physicalShelfCount, 10);
    if (isNaN(count) || count < 0) {
      setAuditMessage({ type: "error", text: "Please enter a valid non-negative physical count." });
      notifyError("Invalid Count", "Please enter a valid non-negative physical count.");
      return;
    }

    onUpdateProductStock(selectedAuditProductId, count, auditNotes);
    const auditedProd = products.find((p) => p.id === selectedAuditProductId);
    notifySuccess(
      "Stock Audit Applied",
      `Physical count of ${count} recorded for ${auditedProd?.name || "Product"}.`
    );
    setAuditMessage({
      type: "success",
      text: "Physical stock count recorded and inventory adjusted successfully."
    });
    setPhysicalShelfCount("");
    setAuditNotes("");
    setTimeout(() => setAuditMessage(null), 4000);
  };

  // Add staff handler
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUsername.trim() || !newStaffFullName.trim() || !newStaffPin.trim() || !newStaffEmail.trim()) {
      setStaffError("Please fill in all required fields (Username, Full Name, Password, Email).");
      return;
    }

    const pass = newStaffPin.trim();
    if (pass.length < 6 || pass.length > 8) {
      setStaffError("Staff password must be between 6 and 8 characters in length.");
      return;
    }

    onCreateUser({
      username: newStaffUsername.trim(),
      fullName: newStaffFullName.trim(),
      role: newStaffRole,
      pin: pass,
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim() || undefined
    });

    notifySuccess(
      "Staff Account Activated",
      `${newStaffFullName.trim()} has been assigned the '${newStaffRole}' role.`
    );
    setNewStaffUsername("");
    setNewStaffFullName("");
    setNewStaffPin("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setStaffError(null);
    setIsAddStaffOpen(false);
  };

  // Add frequency schedule handler
  const handleCreateFreq = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFrequency({
      frequency: freqType,
      targetDayOrDate: freqDay,
      timeOfDay: freqTime,
      notes: freqNotes.trim() || `${freqType} routine stock audit`,
      enableAppReminder: freqAppAlert,
      enableEmailReminder: freqEmailAlert,
      notificationEmail: freqEmail.trim() || undefined
    });

    notifySuccess("Audit Schedule Saved", `${freqType} reminder configured.`);
    setFreqNotes("");
    setIsAddFreqOpen(false);
  };

  // Save workspace profile handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePharmacy({
      ...currentPharmacy,
      name: profileName.trim(),
      directorName: profileDirector.trim(),
      location: profileLocation.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      cacNumber: profileCac.trim(),
      pcnLicense: profilePcn.trim()
    });
    notifySuccess("Pharmacy Profile Updated", `${profileName} registration saved.`);
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  // Export sales to Excel
  const handleExportSales = () => {
    const exportData = salesRecords.map((s) => ({
      "Transaction ID": s.id,
      "Date & Time": new Date(s.timestamp).toLocaleString(),
      "Cashier": s.cashierName,
      "Payment Method": s.paymentMethod,
      "Total Amount (NGN)": s.total,
      "Cash Paid (NGN)": s.cashPaid,
      "Transfer Paid (NGN)": s.transferPaid,
      "Card Paid (NGN)": s.cardPaid,
      "Change Due (NGN)": s.changeDue,
      "Items Breakdown": s.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Transactions");
    XLSX.writeFile(workbook, `Pocket_Pharmacy_Sales_${currentPharmacy.id}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notifySuccess("Sales Report Exported", `Excel spreadsheet generated with ${salesRecords.length} records.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Super Admin Top Hero Bar */}
      <div className="bg-[#0a4738] text-white rounded-3xl p-6 sm:p-8 border border-[#145a49] shadow-xl relative overflow-hidden">
        {/* Giant subtle watermark cross */}
        <div className="absolute -right-8 -bottom-12 opacity-15 pointer-events-none text-[#3be8b0]">
          <svg className="w-56 h-56" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 3a2 2 0 0 1 4 0v6h6a2 2 0 1 1 0 4h-6v6a2 2 0 1 1-4 0v-6H4a2 2 0 1 1 0-4h6V3z" />
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3">
            <PocketPharmacyLogo
              size="lg"
              variant="dark"
              tenantName={currentPharmacy.name}
              tenantLocation={currentPharmacy.location}
              showTenantSubtitle={false}
            />
            <div className="flex items-center gap-3 pt-1">
              <div className="p-1.5 rounded-lg bg-[#145a49] border border-[#227a64] text-[#3be8b0]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Super Admin Control Center
              </h1>
            </div>
            <p className="text-sm sm:text-base text-emerald-300 max-w-2xl leading-relaxed">
              Dedicated workspace for <span className="font-bold text-[#3be8b0]">{currentPharmacy.name}</span>. Manage sales analytics, stock discrepancy audits, automated reminders, staff permissions, and cloud database backups.
            </p>
          </div>

          {/* Backup Database Action Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={onManualBackup}
              disabled={isBackingUp}
              className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
                isBackingUp
                  ? "bg-[#063327] text-emerald-400 border border-[#145a49] cursor-not-allowed"
                  : "bg-[#145a49] hover:bg-[#1b6b57] text-white border border-[#3be8b0] shadow-emerald-950"
              }`}
            >
              <CloudUpload className={`w-5 h-5 text-[#3be8b0] ${isBackingUp ? "animate-spin" : ""}`} />
              <span>{isBackingUp ? "Backing up Database..." : "Backup Database Now"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveAdminTab("sales")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeAdminTab === "sales"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sales & Revenue ({salesRecords.length})
          </button>

          <button
            onClick={() => setActiveAdminTab("auditor")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeAdminTab === "auditor"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Stock Discrepancy Auditor
          </button>

          <button
            onClick={() => setActiveAdminTab("staff")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeAdminTab === "staff"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Users className="w-4 h-4" />
            Staff & Permissions ({staffUsers.length})
          </button>

          <button
            onClick={() => setActiveAdminTab("workspace")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeAdminTab === "workspace"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Workspace Profile
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SALES & REVENUE ================= */}
      {activeAdminTab === "sales" && (
        <div className="space-y-6">
          
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Total Sales</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-1">
                ₦{salesMetrics.totalRevenue.toLocaleString("en-NG")}
              </p>
              <p className="text-xs text-slate-400 mt-1">{salesMetrics.count} settled transactions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Cash Collected
              </p>
              <p className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                ₦{salesMetrics.totalCash.toLocaleString("en-NG")}
              </p>
              <p className="text-xs text-slate-400 mt-1">Direct physical cash</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <ArrowRight className="w-4 h-4 text-cyan-600" />
                Bank Transfers
              </p>
              <p className="text-2xl font-bold text-cyan-700 font-mono mt-1">
                ₦{salesMetrics.totalTransfer.toLocaleString("en-NG")}
              </p>
              <p className="text-xs text-slate-400 mt-1">Verified bank transfers</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                POS Card Swipes
              </p>
              <p className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                ₦{salesMetrics.totalCard.toLocaleString("en-NG")}
              </p>
              <p className="text-xs text-slate-400 mt-1">Electronic card terminal</p>
            </div>
          </div>

          {/* Transactions Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Header & Filter Controls */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sales Transactions Ledger</h3>
                <p className="text-sm text-slate-500">Real-time audit log of all customer purchases</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search cashier, item or ID..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Split">Split</option>
                </select>

                <button
                  onClick={handleExportSales}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Time & Date</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Dispensed Products</th>
                    <th className="py-3 px-4">Payment Split</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No transactions recorded yet in this workspace.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800">
                          <div>{new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          <div className="text-xs text-slate-400">{new Date(s.timestamp).toLocaleDateString()}</div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {s.cashierName}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                          {s.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                            {s.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-base">
                          ₦{s.total.toLocaleString("en-NG")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: STOCK DISCREPANCY AUDITOR ================= */}
      {activeAdminTab === "auditor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Audit Action Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  Perform Physical Stock Count
                </h3>
                <p className="text-xs text-slate-500">
                  Compare physical shelf counts against system inventory records
                </p>
              </div>

              {auditMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    auditMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {auditMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{auditMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleApplyAudit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Select Product to Audit *
                  </label>
                  <select
                    value={selectedAuditProductId}
                    onChange={(e) => setSelectedAuditProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current System: {p.quantity} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Physical Shelf Count (Actual Units) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 24"
                    value={physicalShelfCount}
                    onChange={(e) => setPhysicalShelfCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Audit Notes / Reason for Adjustment
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Physical count reconciliation, damaged blister pack removed, etc."
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Save Count & Reconcile Discrepancy
                </button>
              </form>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Reconciliation & Audit History</h3>
                <p className="text-sm text-slate-500">Historical records of shelf counts and quantity revisions</p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {auditRecords.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No stock audit records yet</p>
                    <p className="text-xs text-slate-400 mt-1">Submit your first shelf verification using the form.</p>
                  </div>
                ) : (
                  auditRecords.map((a) => (
                    <div key={a.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-bold text-base text-slate-900">{a.productName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Audited by <span className="font-semibold text-slate-700">{a.auditorName}</span> on{" "}
                            {new Date(a.timestamp).toLocaleString()}
                          </p>
                          {a.notes && (
                            <p className="text-xs text-slate-600 italic mt-1 bg-slate-100 px-2 py-1 rounded-md">
                              "{a.notes}"
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-800">
                            Count: <span className="font-bold font-mono">{a.shelfCount} units</span>
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono mt-1 ${
                              a.discrepancy === 0
                                ? "bg-emerald-100 text-emerald-800"
                                : a.discrepancy < 0
                                ? "bg-red-100 text-red-800"
                                : "bg-cyan-100 text-cyan-800"
                            }`}
                          >
                            {a.discrepancy === 0
                              ? "Exact Match (0)"
                              : a.discrepancy > 0
                              ? `+${a.discrepancy} surplus`
                              : `${a.discrepancy} deficit`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: STAFF & PERMISSIONS ================= */}
      {activeAdminTab === "staff" && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Staff Directory & Account Roles
              </h3>
              <p className="text-sm text-slate-500">
                Create and manage sub-users who have access to this pharmacy workspace
              </p>
            </div>

            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </button>
          </div>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{user.fullName}</h4>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        user.role === "super_admin"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : user.role === "admin"
                          ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Cashier"}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Login Credentials
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditStaff(user)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                        title="Edit credentials & password"
                      >
                        <Edit className="w-3 h-3" />
                        Edit Password
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Username:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {user.username}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          {revealedPasswords[user.id] ? user.pin : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                          title={revealedPasswords[user.id] ? "Hide password" : "Show password"}
                        >
                          {revealedPasswords[user.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-700 truncate max-w-[150px] font-medium">{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditStaff(user)}
                      className="text-xs text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {user.role !== "super_admin" && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Staff & Password Modal */}
          {editingStaff && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-emerald-600" />
                    Edit Staff & Password
                  </h3>
                  <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStaffEdit} className="space-y-4">
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                      {editError}
                    </div>
                  )}

                  {editSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {editSuccessMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Staff Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Assigned Role *
                      </label>
                      <select
                        value={editRole}
                        disabled={editingStaff.role === "super_admin"}
                        onChange={(e) => setEditRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-semibold disabled:opacity-60"
                      >
                        {editingStaff.role === "super_admin" ? (
                          <option value="super_admin">Super Admin</option>
                        ) : (
                          <>
                            <option value="cashier">Cashier (POS only)</option>
                            <option value="admin">Admin (Full access)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Password (6-8 characters) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        minLength={6}
                        maxLength={8}
                        placeholder="e.g. AdePass or Cash12"
                        value={editPin}
                        onChange={(e) => setEditPin(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm text-slate-900 font-mono font-bold tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Super Admin can view and update this 6-8 character password at any time.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Staff Modal */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    Add Staff Member to Workspace
                  </h3>
                  <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4">
                  {staffError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                      {staffError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pharm. Chinedu Okafor"
                      value={newStaffFullName}
                      onChange={(e) => setNewStaffFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Staff Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. cashier_ade"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Assigned Role *
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-semibold"
                      >
                        <option value="cashier">Cashier (POS only)</option>
                        <option value="admin">Admin (Full access)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Staff Password (6-8 characters) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      maxLength={8}
                      placeholder="e.g. AdePass or Cash12"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono font-bold"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 font-mono">
                      Password must be 6-8 characters (letters, numbers, or any combination)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="staff@pharmacy.com"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+234..."
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddStaffOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: WORKSPACE PROFILE ================= */}
      {activeAdminTab === "workspace" && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-600" />
                Pharmacy Workspace Profile
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Official regulatory credentials and billing contact details for this tenant space
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pharmacy profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Pharmacy Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Superintendent / Director Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileDirector}
                    onChange={(e) => setProfileDirector(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Pharmacy Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={profileLocation}
                  onChange={(e) => setProfileLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Official Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    CAC Registration Number
                  </label>
                  <input
                    type="text"
                    value={profileCac}
                    onChange={(e) => setProfileCac(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    PCN Premises License ID
                  </label>
                  <input
                    type="text"
                    value={profilePcn}
                    onChange={(e) => setProfilePcn(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  Save Pharmacy Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
