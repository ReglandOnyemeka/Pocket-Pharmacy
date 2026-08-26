import React, { useState, useEffect, useCallback } from "react";
import {
  Pharmacy,
  AppUser,
  Product,
  SaleRecord,
  StockAuditRecord,
  StockFrequency,
  AuditScheduleLog,
  ReceiptData,
  UserRole,
  FeaturePermission
} from "./types";
import {
  initTenantRegistry,
  createTenantWorkspace,
  createTenantUser,
  deleteTenantUser,
  getTenantUsers,
  updateTenantPharmacy,
  getTenantProducts,
  saveTenantProducts,
  getTenantSales,
  saveTenantSales,
  getTenantAudits,
  saveTenantAudits,
  getTenantFrequencies,
  saveTenantFrequencies,
  getTenantLogs,
  saveTenantLogs,
  backupTenantDatabase,
  getLastBackupTime
} from "./utils/tenantStorage";
import { Navbar } from "./components/Navbar";
import { POSDesk } from "./components/POSDesk";
import { InventoryManager } from "./components/InventoryManager";
import { PharmacyAlerts } from "./components/PharmacyAlerts";
import { AiAssistant } from "./components/AiAssistant";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { AuthModal } from "./components/AuthModal";
import { ReceiptModal } from "./components/ReceiptModal";

export function App() {
  // Tenant & User Global Registries
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Active Tenant & Active User State
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "alerts" | "ai_consult" | "admin">("pos");

  // Isolated Tenant Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [auditRecords, setAuditRecords] = useState<StockAuditRecord[]>([]);
  const [frequencies, setFrequencies] = useState<StockFrequency[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditScheduleLog[]>([]);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);

  // Modals & Consult State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [consultTargetProduct, setConsultTargetProduct] = useState<Product | null>(null);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  // Backup & 10-Minute Auto-Sync State
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // 1. Initial Multi-Tenant Boot
  useEffect(() => {
    const { pharmacies: initialPharmacies, users: initialUsers } = initTenantRegistry();
    setPharmacies(initialPharmacies);
    setUsers(initialUsers);

    // Check saved active user/pharmacy
    const savedUserRaw = localStorage.getItem("pocket_active_user");
    const savedPharmRaw = localStorage.getItem("pocket_active_pharmacy");

    let activeU: AppUser | null = null;
    let activeP: Pharmacy | null = null;

    if (savedUserRaw && savedPharmRaw) {
      try {
        activeU = JSON.parse(savedUserRaw);
        activeP = JSON.parse(savedPharmRaw);
      } catch (e) {
        // fallback
      }
    }

    if (!activeU || !activeP) {
      activeU = initialUsers[0];
      activeP = initialPharmacies.find((p) => p.id === activeU!.pharmacyId) || initialPharmacies[0];
      localStorage.setItem("pocket_active_user", JSON.stringify(activeU));
      localStorage.setItem("pocket_active_pharmacy", JSON.stringify(activeP));
    }

    setCurrentUser(activeU);
    setCurrentPharmacy(activeP);
    loadTenantData(activeP.id);
  }, []);

  // 2. Load Isolated Tenant Data
  const loadTenantData = useCallback((pharmacyId: string) => {
    const p = getTenantProducts(pharmacyId);
    const s = getTenantSales(pharmacyId);
    const a = getTenantAudits(pharmacyId);
    const f = getTenantFrequencies(pharmacyId);
    const l = getTenantLogs(pharmacyId);
    const u = getTenantUsers(pharmacyId);
    const b = getLastBackupTime(pharmacyId);

    setProducts(p);
    setSalesRecords(s);
    setAuditRecords(a);
    setFrequencies(f);
    setAuditLogs(l);
    setStaffUsers(u);
    setLastBackupTime(b);
  }, []);

  // 3. Automated 10-Minute Background Sync (When Online)
  useEffect(() => {
    if (!currentPharmacy) return;

    const AUTO_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    const syncTenant = async () => {
      if (navigator.onLine && currentPharmacy) {
        try {
          const res = await backupTenantDatabase(currentPharmacy.id, currentPharmacy);
          setLastBackupTime(res.timestamp);
        } catch (e) {
          console.warn("[Auto-Sync 10m] Background sync completed locally.", e);
        }
      }
    };

    // Trigger initial silent sync check
    syncTenant();

    // Set 10-minute recurring interval
    const interval = setInterval(syncTenant, AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentPharmacy]);

  // 4. Manual Database Backup Handler
  const handleManualBackup = async () => {
    if (!currentPharmacy) return;
    setIsBackingUp(true);
    try {
      const res = await backupTenantDatabase(currentPharmacy.id, currentPharmacy);
      setLastBackupTime(res.timestamp);
    } catch (e) {
      console.error("Backup error", e);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 5. Multi-Tenant User Login
  const handleLogin = (user: AppUser, pharmacy: Pharmacy) => {
    setCurrentUser(user);
    setCurrentPharmacy(pharmacy);
    localStorage.setItem("pocket_active_user", JSON.stringify(user));
    localStorage.setItem("pocket_active_pharmacy", JSON.stringify(pharmacy));
    loadTenantData(pharmacy.id);
    setActiveTab(user.role === "cashier" ? "pos" : "pos");
  };

  // 6. Multi-Tenant Registration (Creates new Super Admin & isolated workspace)
  const handleRegisterTenant = (params: {
    pharmacyName: string;
    directorName: string;
    location: string;
    phone: string;
    email: string;
    username: string;
    pin: string;
    cacNumber?: string;
    pcnLicense?: string;
  }) => {
    const { pharmacy: newPharm, superAdmin } = createTenantWorkspace(params);
    const { pharmacies: updatedPharmList, users: updatedUserList } = initTenantRegistry();
    setPharmacies(updatedPharmList);
    setUsers(updatedUserList);

    setCurrentPharmacy(newPharm);
    setCurrentUser(superAdmin);
    loadTenantData(newPharm.id);
    setActiveTab("admin");
  };

  // 7. Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPharmacy(null);
    localStorage.removeItem("pocket_active_user");
    localStorage.removeItem("pocket_active_pharmacy");
    setIsAuthModalOpen(false);
  };

  // 8. POS Sale Completed
  const handleCompleteSale = (saleData: Omit<SaleRecord, "id" | "timestamp">) => {
    if (!currentPharmacy) return;

    const newSale: SaleRecord = {
      ...saleData,
      id: `RCP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };

    // Update sales records
    const updatedSales = [newSale, ...salesRecords];
    setSalesRecords(updatedSales);
    saveTenantSales(currentPharmacy.id, updatedSales);

    // Decrement product inventory
    const updatedProducts = products.map((p) => {
      const soldItem = saleData.items.find((item) => item.product.id === p.id);
      if (soldItem) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - soldItem.quantity)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveTenantProducts(currentPharmacy.id, updatedProducts);

    // Trigger digital receipt
    setLastReceipt({
      receiptId: newSale.id,
      date: new Date().toLocaleString(),
      items: newSale.items,
      total: newSale.total,
      cashPaid: newSale.cashPaid,
      transferPaid: newSale.transferPaid,
      cardPaid: newSale.cardPaid,
      change: newSale.changeDue,
      cashier: newSale.cashierName,
      pharmacyName: currentPharmacy.name,
      pharmacyPhone: currentPharmacy.phone,
      pharmacyLocation: currentPharmacy.location
    });
  };

  // 9. Product Inventory Operations
  const handleAddProduct = (prodData: Omit<Product, "id">) => {
    if (!currentPharmacy) return;
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`
    };
    const updated = [newProd, ...products];
    setProducts(updated);
    saveTenantProducts(currentPharmacy.id, updated);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    if (!currentPharmacy) return;
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    saveTenantProducts(currentPharmacy.id, updated);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!currentPharmacy) return;
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveTenantProducts(currentPharmacy.id, updated);
  };

  const handleBulkImportProducts = (imported: Omit<Product, "id">[]) => {
    if (!currentPharmacy) return;
    const newProds: Product[] = imported.map((p, idx) => ({
      ...p,
      id: `prod_${Date.now()}_${idx}`
    }));
    const updated = [...newProds, ...products];
    setProducts(updated);
    saveTenantProducts(currentPharmacy.id, updated);
  };

  // 10. Super Admin Stock Audit Quantity Revision
  const handleUpdateProductStock = (productId: string, newStock: number, notes: string) => {
    if (!currentPharmacy || !currentUser) return;
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const discrepancy = newStock - target.quantity;

    const auditRecord: StockAuditRecord = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: target.id,
      productName: target.name,
      previousQuantity: target.quantity,
      shelfCount: newStock,
      discrepancy,
      auditorName: currentUser.fullName,
      pharmacyId: currentPharmacy.id,
      notes: notes || undefined
    };

    const updatedAudits = [auditRecord, ...auditRecords];
    setAuditRecords(updatedAudits);
    saveTenantAudits(currentPharmacy.id, updatedAudits);

    const updatedProducts = products.map((p) => (p.id === productId ? { ...p, quantity: newStock } : p));
    setProducts(updatedProducts);
    saveTenantProducts(currentPharmacy.id, updatedProducts);
  };

  // 11. Staff Management by Super Admin
  const handleCreateStaffUser = (userData: {
    username: string;
    fullName: string;
    role: "cashier" | "admin" | "super_admin";
    pin: string;
    email: string;
    phone?: string;
    accessibleFeatures?: FeaturePermission[];
  }) => {
    if (!currentPharmacy) return;
    createTenantUser(currentPharmacy.id, userData);
    const updated = getTenantUsers(currentPharmacy.id);
    setStaffUsers(updated);
    const { users: allU } = initTenantRegistry();
    setUsers(allU);
  };

  const handleUpdateStaffUser = (updatedUser: AppUser) => {
    if (!currentPharmacy) return;
    updateTenantUser(updatedUser);
    const updated = getTenantUsers(currentPharmacy.id);
    setStaffUsers(updated);
    const { users: allU } = initTenantRegistry();
    setUsers(allU);

    // If updating current logged in user, update state & localStorage
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem("pocket_active_user", JSON.stringify(updatedUser));
    }
  };

  const handleDeleteStaffUser = (userId: string) => {
    if (!currentPharmacy) return;
    deleteTenantUser(userId);
    const updated = getTenantUsers(currentPharmacy.id);
    setStaffUsers(updated);
    const { users: allU } = initTenantRegistry();
    setUsers(allU);
  };

  // 12. Frequency Schedules & Reminder Logs
  const handleAddFrequency = (freqData: Omit<StockFrequency, "id" | "pharmacyId">) => {
    if (!currentPharmacy) return;
    const newFreq: StockFrequency = {
      ...freqData,
      id: `SF-${Date.now().toString().slice(-4)}`,
      pharmacyId: currentPharmacy.id
    };
    const updated = [...frequencies, newFreq];
    setFrequencies(updated);
    saveTenantFrequencies(currentPharmacy.id, updated);
  };

  const handleDeleteFrequency = (freqId: string) => {
    if (!currentPharmacy) return;
    const updated = frequencies.filter((f) => f.id !== freqId);
    setFrequencies(updated);
    saveTenantFrequencies(currentPharmacy.id, updated);
  };

  const handleDispatchReminderTest = (freq: StockFrequency) => {
    if (!currentPharmacy) return;
    const newLog: AuditScheduleLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scheduleId: freq.id,
      scheduleDetails: `${freq.frequency} (${freq.targetDayOrDate} at ${freq.timeOfDay})`,
      type: freq.enableEmailReminder ? "email" : "app",
      message: `24-Hour Notice: Scheduled ${freq.frequency} stock audit is coming up. Scope: ${freq.notes}`,
      recipient: freq.notificationEmail || currentPharmacy.email,
      pharmacyId: currentPharmacy.id
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveTenantLogs(currentPharmacy.id, updatedLogs);
  };

  // 13. Update Pharmacy Profile
  const handleUpdatePharmacyProfile = (updatedPharm: Pharmacy) => {
    updateTenantPharmacy(updatedPharm);
    setCurrentPharmacy(updatedPharm);
    const { pharmacies: allP } = initTenantRegistry();
    setPharmacies(allP);
  };

  // 14. Request AI Consult from any product
  const handleRequestAiConsult = (product: Product) => {
    setConsultTargetProduct(product);
    setActiveTab("ai_consult");
  };

  if (!currentPharmacy || !currentUser) {
    return (
      <AuthModal
        isOpen={true}
        isFullScreen={true}
        showCancelButton={false}
        onClose={() => {}}
        pharmacies={pharmacies}
        users={users}
        onLogin={handleLogin}
        onRegisterTenant={handleRegisterTenant}
      />
    );
  }

  const currentRole = currentUser.role;
  const canEditInventory = currentRole === "admin" || currentRole === "super_admin";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Application Navbar */}
      <Navbar
        currentPharmacy={currentPharmacy}
        currentUser={currentUser}
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastBackupTime={lastBackupTime}
        isBackingUp={isBackingUp}
        onManualBackup={handleManualBackup}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === "pos" && (
          <POSDesk
            products={products}
            onCompleteSale={handleCompleteSale}
            onRequestAiConsult={handleRequestAiConsult}
            cashierName={currentUser.fullName}
            pharmacyId={currentPharmacy.id}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryManager
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBulkImport={handleBulkImportProducts}
            pharmacyId={currentPharmacy.id}
            canEditInventory={canEditInventory}
          />
        )}

        {activeTab === "alerts" && (
          <PharmacyAlerts
            products={products}
            onRequestAiConsult={handleRequestAiConsult}
          />
        )}

        {activeTab === "ai_consult" && (
          <AiAssistant
            initialProduct={consultTargetProduct}
            onClearInitialProduct={() => setConsultTargetProduct(null)}
          />
        )}

        {activeTab === "admin" && (currentRole === "super_admin" || currentRole === "admin") && (
          <SuperAdminDashboard
            currentPharmacy={currentPharmacy}
            currentUser={currentUser}
            products={products}
            salesRecords={salesRecords}
            auditRecords={auditRecords}
            frequencies={frequencies}
            auditLogs={auditLogs}
            staffUsers={staffUsers}
            lastBackupTime={lastBackupTime}
            isBackingUp={isBackingUp}
            onManualBackup={handleManualBackup}
            onUpdatePharmacy={handleUpdatePharmacyProfile}
            onCreateUser={handleCreateStaffUser}
            onUpdateUser={handleUpdateStaffUser}
            onDeleteUser={handleDeleteStaffUser}
            onUpdateProductStock={handleUpdateProductStock}
            onAddFrequency={handleAddFrequency}
            onDeleteFrequency={handleDeleteFrequency}
            onDispatchReminderTest={handleDispatchReminderTest}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        pharmacies={pharmacies}
        users={users}
        onLogin={handleLogin}
        onRegisterTenant={handleRegisterTenant}
      />

      <ReceiptModal
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />
    </div>
  );
}

export default App;
