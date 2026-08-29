import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Pharmacy,
  AppUser,
  Product,
  SaleRecord,
  StockAuditRecord,
  StockFrequency,
  AuditScheduleLog,
  ReceiptData,
  FeaturePermission
} from "./types";
import {
  initTenantRegistry,
  createTenantWorkspace,
  createTenantUser,
  updateTenantUser,
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
  getLastBackupTime,
  subscribeTenantRegistry,
  pullTenantFromFirebase
} from "./utils/tenantStorage";
import { Navbar } from "./components/Navbar";
import { POSDesk } from "./components/POSDesk";
import { InventoryManager } from "./components/InventoryManager";
import { PharmacyAlerts } from "./components/PharmacyAlerts";
import { AiAssistant } from "./components/AiAssistant";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { AuthModal } from "./components/AuthModal";
import { ReceiptModal } from "./components/ReceiptModal";
import { LandingPage } from "./components/LandingPage";
import { ToastProvider, useToast } from "./context/ToastContext";
import { ToastContainer } from "./components/ToastContainer";

function AppContent() {
  const { notifyProductAdded, notifyCheckout, notifyUpload, notifySuccess, notifyError } = useToast();

  // Tenant & User Global Registries
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Active Tenant & Active User State
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Active View Tab & Landing Page State (Landing page is the entry point)
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "alerts" | "ai_consult" | "admin">("pos");
  const [isViewingLanding, setIsViewingLanding] = useState<boolean>(true);

  // Isolated Tenant Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [auditRecords, setAuditRecords] = useState<StockAuditRecord[]>([]);
  const [frequencies, setFrequencies] = useState<StockFrequency[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditScheduleLog[]>([]);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);

  // Modals & Consult State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [consultTargetProduct, setConsultTargetProduct] = useState<Product | null>(null);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  // Backup & 10-Minute Auto-Sync State
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // 1. Load Isolated Tenant Data
  const loadTenantData = useCallback((pharmacyId: string) => {
    setProducts(getTenantProducts(pharmacyId));
    setSalesRecords(getTenantSales(pharmacyId));
    setAuditRecords(getTenantAudits(pharmacyId));
    setFrequencies(getTenantFrequencies(pharmacyId));
    setAuditLogs(getTenantLogs(pharmacyId));
    setStaffUsers(getTenantUsers(pharmacyId));
    setLastBackupTime(getLastBackupTime(pharmacyId));
  }, []);

  // 2. Initial Multi-Tenant Boot & Real-Time Cloud Listener
  useEffect(() => {
    const { pharmacies: initialPharmacies, users: initialUsers } = initTenantRegistry();
    setPharmacies(initialPharmacies);
    setUsers(initialUsers);

    // Subscribe to live cloud updates for pharmacies and users
    const unsubscribe = subscribeTenantRegistry((updatedPharmacies, updatedUsers) => {
      setPharmacies(updatedPharmacies);
      setUsers(updatedUsers);
    });

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
        // Fallback silently if storage is corrupt
      }
    }

    if (!activeU || !activeP) {
      activeU = initialUsers[0] || null;
      activeP = initialPharmacies.find((p) => p.id === activeU?.pharmacyId) || initialPharmacies[0] || null;
      if (activeU && activeP) {
        localStorage.setItem("pocket_active_user", JSON.stringify(activeU));
        localStorage.setItem("pocket_active_pharmacy", JSON.stringify(activeP));
      }
    }

    if (activeU && activeP) {
      setCurrentUser(activeU);
      setCurrentPharmacy(activeP);
      loadTenantData(activeP.id);
    }

    return () => unsubscribe();
  }, [loadTenantData]);

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

    syncTenant();

    const interval = setInterval(syncTenant, AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentPharmacy]);

  // 4. Manual Database Backup Handler
  const handleManualBackup = useCallback(async () => {
    if (!currentPharmacy) return;
    setIsBackingUp(true);
    try {
      const res = await backupTenantDatabase(currentPharmacy.id, currentPharmacy);
      setLastBackupTime(res.timestamp);
      notifyUpload(
        "Database Synchronized & Backed Up",
        `Safely synchronized ${products.length} products and ${salesRecords.length} sales to encrypted offline storage & cloud sync.`
      );
    } catch (e) {
      console.error("Backup error", e);
      notifyError("Backup Error", "Could not complete database backup.");
    } finally {
      setIsBackingUp(false);
    }
  }, [currentPharmacy, products.length, salesRecords.length, notifyUpload, notifyError]);

  // 5. Multi-Tenant User Login
  const handleLogin = useCallback((user: AppUser, pharmacy: Pharmacy) => {
    setCurrentUser(user);
    setCurrentPharmacy(pharmacy);
    localStorage.setItem("pocket_active_user", JSON.stringify(user));
    localStorage.setItem("pocket_active_pharmacy", JSON.stringify(pharmacy));
    loadTenantData(pharmacy.id);
    setIsViewingLanding(false);
    setIsAuthModalOpen(false);
    setActiveTab(user.role === "cashier" ? "pos" : "pos");
    notifySuccess("Welcome Back", `Signed in to ${pharmacy.name} as ${user.fullName}.`);

    // Asynchronously pull cloud tenant catalog/records if any exist
    pullTenantFromFirebase(pharmacy.id).then((snapshot) => {
      if (snapshot) {
        loadTenantData(pharmacy.id);
      }
    }).catch(() => null);
  }, [loadTenantData, notifySuccess]);

  // 6. Multi-Tenant Registration (Creates new Super Admin & isolated workspace)
  const handleRegisterTenant = useCallback((params: {
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
    notifySuccess("Workspace Activated", `Registered and launched ${newPharm.name}.`);
  }, [loadTenantData, notifySuccess]);

  // 7. Logout
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentPharmacy(null);
    localStorage.removeItem("pocket_active_user");
    localStorage.removeItem("pocket_active_pharmacy");
    setIsAuthModalOpen(false);
    notifySuccess("Logged Out", "You have securely signed out of your pharmacy session.");
  }, [notifySuccess]);

  // 8. POS Sale Completed
  const handleCompleteSale = useCallback((saleData: Omit<SaleRecord, "id" | "timestamp">) => {
    if (!currentPharmacy) return;

    const newSale: SaleRecord = {
      ...saleData,
      id: `RCP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };

    setSalesRecords((prevSales) => {
      const updatedSales = [newSale, ...prevSales];
      saveTenantSales(currentPharmacy.id, updatedSales);
      return updatedSales;
    });

    setProducts((prevProducts) => {
      const updatedProducts = prevProducts.map((p) => {
        const soldItem = saleData.items.find((item) => item.product.id === p.id);
        if (soldItem) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - soldItem.quantity)
          };
        }
        return p;
      });
      saveTenantProducts(currentPharmacy.id, updatedProducts);
      return updatedProducts;
    });

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

    // Notification for successful checkout
    notifyCheckout({
      receiptId: newSale.id,
      total: newSale.total,
      itemsCount: newSale.items.length,
      paymentMethod: newSale.paymentMethod,
      customerName: newSale.customerName
    });
  }, [currentPharmacy, notifyCheckout]);

  // 9. Product Inventory Operations
  const handleAddProduct = useCallback((prodData: Omit<Product, "id">) => {
    if (!currentPharmacy) return;
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`
    };
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      saveTenantProducts(currentPharmacy.id, updated);
      return updated;
    });

    // Notification for product added
    notifyProductAdded({
      name: prodData.name,
      quantity: prodData.quantity,
      price: prodData.price,
      drug_type: prodData.drug_type
    });
  }, [currentPharmacy, notifyProductAdded]);

  const handleUpdateProduct = useCallback((updatedProd: Product) => {
    if (!currentPharmacy) return;
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProd.id ? updatedProd : p));
      saveTenantProducts(currentPharmacy.id, updated);
      return updated;
    });
    notifySuccess("Product Updated", `${updatedProd.name} stock and details have been updated.`);
  }, [currentPharmacy, notifySuccess]);

  const handleDeleteProduct = useCallback((productId: string) => {
    if (!currentPharmacy) return;
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      saveTenantProducts(currentPharmacy.id, updated);
      return updated;
    });
    notifySuccess("Product Removed", "Product removed from inventory catalog.");
  }, [currentPharmacy, notifySuccess]);

  const handleBulkImportProducts = useCallback((imported: Omit<Product, "id">[]) => {
    if (!currentPharmacy) return;
    const newProds: Product[] = imported.map((p, idx) => ({
      ...p,
      id: `prod_${Date.now()}_${idx}`
    }));
    setProducts((prev) => {
      const updated = [...newProds, ...prev];
      saveTenantProducts(currentPharmacy.id, updated);
      return updated;
    });

    // Notification for bulk upload
    notifyUpload(
      "Bulk Inventory Uploaded",
      `Successfully imported and indexed ${imported.length} product${imported.length === 1 ? "" : "s"} into ${currentPharmacy.name} active stock catalog.`,
      { count: imported.length }
    );
  }, [currentPharmacy, notifyUpload]);

  // 10. Super Admin Stock Audit Quantity Revision
  const handleUpdateProductStock = useCallback((productId: string, newStock: number, notes: string) => {
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

    setAuditRecords((prev) => {
      const updatedAudits = [auditRecord, ...prev];
      saveTenantAudits(currentPharmacy.id, updatedAudits);
      return updatedAudits;
    });

    setProducts((prev) => {
      const updatedProducts = prev.map((p) => (p.id === productId ? { ...p, quantity: newStock } : p));
      saveTenantProducts(currentPharmacy.id, updatedProducts);
      return updatedProducts;
    });
  }, [currentPharmacy, currentUser, products]);

  // 11. Staff Management by Super Admin
  const handleCreateStaffUser = useCallback((userData: {
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
  }, [currentPharmacy]);

  const handleUpdateStaffUser = useCallback((updatedUser: AppUser) => {
    if (!currentPharmacy) return;
    updateTenantUser(updatedUser);
    const updated = getTenantUsers(currentPharmacy.id);
    setStaffUsers(updated);
    const { users: allU } = initTenantRegistry();
    setUsers(allU);

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem("pocket_active_user", JSON.stringify(updatedUser));
    }
  }, [currentPharmacy, currentUser]);

  const handleDeleteStaffUser = useCallback((userId: string) => {
    if (!currentPharmacy) return;
    deleteTenantUser(userId);
    const updated = getTenantUsers(currentPharmacy.id);
    setStaffUsers(updated);
    const { users: allU } = initTenantRegistry();
    setUsers(allU);
  }, [currentPharmacy]);

  // 12. Frequency Schedules & Reminder Logs
  const handleAddFrequency = useCallback((freqData: Omit<StockFrequency, "id" | "pharmacyId">) => {
    if (!currentPharmacy) return;
    const newFreq: StockFrequency = {
      ...freqData,
      id: `SF-${Date.now().toString().slice(-4)}`,
      pharmacyId: currentPharmacy.id
    };
    setFrequencies((prev) => {
      const updated = [...prev, newFreq];
      saveTenantFrequencies(currentPharmacy.id, updated);
      return updated;
    });
  }, [currentPharmacy]);

  const handleDeleteFrequency = useCallback((freqId: string) => {
    if (!currentPharmacy) return;
    setFrequencies((prev) => {
      const updated = prev.filter((f) => f.id !== freqId);
      saveTenantFrequencies(currentPharmacy.id, updated);
      return updated;
    });
  }, [currentPharmacy]);

  const handleDispatchReminderTest = useCallback((freq: StockFrequency) => {
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

    setAuditLogs((prev) => {
      const updatedLogs = [newLog, ...prev];
      saveTenantLogs(currentPharmacy.id, updatedLogs);
      return updatedLogs;
    });
  }, [currentPharmacy]);

  // 13. Update Pharmacy Profile
  const handleUpdatePharmacyProfile = useCallback((updatedPharm: Pharmacy) => {
    updateTenantPharmacy(updatedPharm);
    setCurrentPharmacy(updatedPharm);
    const { pharmacies: allP } = initTenantRegistry();
    setPharmacies(allP);
  }, []);

  // 14. Request AI Consult from any product
  const handleRequestAiConsult = useCallback((product: Product) => {
    setConsultTargetProduct(product);
    setActiveTab("ai_consult");
  }, []);

  // Permission calculation
  const currentRole = currentUser?.role;
  const canEditInventory = useMemo(() => {
    return currentRole === "admin" || currentRole === "super_admin";
  }, [currentRole]);

  if (isViewingLanding) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setIsViewingLanding(false);
            setIsAuthModalOpen(true);
          }}
          onLogin={() => {
            setIsViewingLanding(false);
            setIsAuthModalOpen(true);
          }}
          onViewWorkspace={() => setIsViewingLanding(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          pharmacies={pharmacies}
          users={users}
          onLogin={(user, pharm) => {
            handleLogin(user, pharm);
            setIsViewingLanding(false);
          }}
          onRegisterTenant={(params) => {
            handleRegisterTenant(params);
            setIsViewingLanding(false);
          }}
          onOpenLanding={() => setIsViewingLanding(true)}
        />
      </>
    );
  }

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
        onOpenLanding={() => setIsViewingLanding(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Application Navbar */}
      <Navbar
        currentPharmacy={currentPharmacy}
        currentUser={currentUser}
        currentRole={currentRole!}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastBackupTime={lastBackupTime}
        onTriggerBackup={handleManualBackup}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
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
            products={products}
            pharmacyName={currentPharmacy.name}
            onClearInitialProduct={() => setConsultTargetProduct(null)}
            onSelectProductForPOS={() => {
              setActiveTab("pos");
            }}
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

export function App() {
  return (
    <ToastProvider>
      <AppContent />
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
