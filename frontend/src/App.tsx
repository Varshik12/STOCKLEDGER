import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  Menu,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AddStockItemModal } from './components/AddStockItemModal';
import { CreatePurchaseModal } from './components/CreatePurchaseModal';
import { CreateSaleModal } from './components/CreateSaleModal';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { DashboardPage } from './pages/DashboardPage';
import { PurchasePage } from './pages/PurchasePage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPage } from './pages/SalesPage';
import { StockPage } from './pages/StockPage';
import { ModuleRoute } from './types/inventory';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

const NAV_ITEMS: Array<{
  id: ModuleRoute;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'purchase', label: 'Purchase', icon: Truck },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const ROUTE_TITLES: Record<ModuleRoute, string> = {
  dashboard: 'Dashboard',
  sales: 'Sales Orders',
  purchase: 'Purchase Orders',
  stock: 'Stock & Ledger',
  reports: 'Reports',
};

function InventoryWorkspace() {
  const { lowStockItems, isLoading, loadError, refreshState, resetDemoData } = useInventory();
  const [route, setRoute] = useState<ModuleRoute>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleDefaultItemId, setSaleDefaultItemId] = useState<string | undefined>(undefined);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseDefaultItemId, setPurchaseDefaultItemId] = useState<string | undefined>(undefined);

  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openNewSale = (itemId?: string) => {
    setSaleDefaultItemId(itemId);
    setSaleModalOpen(true);
  };

  const openNewPurchase = (itemId?: string) => {
    setPurchaseDefaultItemId(itemId);
    setPurchaseModalOpen(true);
  };

  const handleNavigate = (nextRoute: ModuleRoute) => {
    setRoute(nextRoute);
    setMobileMenuOpen(false);
  };

  const handleResetDemo = async () => {
    const res = await resetDemoData();
    notify(res.message, res.ok ? 'success' : 'error');
  };

  const renderPrimaryHeaderAction = () => {
    switch (route) {
      case 'dashboard':
      case 'sales':
        return (
          <button
            type="button"
            onClick={() => openNewSale()}
            className="h-9 px-3.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            New Sale
          </button>
        );
      case 'purchase':
        return (
          <button
            type="button"
            onClick={() => openNewPurchase()}
            className="h-9 px-3.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            New Purchase
          </button>
        );
      case 'stock':
        return (
          <button
            type="button"
            onClick={() => setAddStockModalOpen(true)}
            className="h-9 px-3.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            Add Item
          </button>
        );
      case 'reports':
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-62 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 ease-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
          >
            StockLedger
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="p-1.5 text-slate-500 hover:text-slate-900 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            const showAlertCount = item.id === 'stock' && lowStockItems.length > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 h-10 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                {showAlertCount && (
                  <span className="text-xs font-mono tabular-nums font-medium text-rose-600">
                    {lowStockItems.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => void handleResetDemo()}
            className="w-full flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="text-slate-400 whitespace-nowrap">Workspace</span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-900 truncate">
                {ROUTE_TITLES[route]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {renderPrimaryHeaderAction()}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1380px] w-full mx-auto">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="h-28 bg-white border border-slate-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
              <div className="h-80 bg-white border border-slate-200 rounded-lg animate-pulse" />
            </div>
          ) : loadError ? (
            <div className="bg-white border border-rose-200 rounded-lg p-8 text-center max-w-lg mx-auto my-12">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                Backend Connection Unavailable
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">{loadError}</p>
              <button
                type="button"
                onClick={() => void refreshState()}
                className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : (
            <>
              {route === 'dashboard' && (
                <DashboardPage
                  onNavigate={handleNavigate}
                  onOpenNewSale={openNewSale}
                  onOpenNewPurchase={openNewPurchase}
                  onOpenAddStock={() => setAddStockModalOpen(true)}
                />
              )}
              {route === 'sales' && (
                <SalesPage onOpenNewSale={() => openNewSale()} onNotify={notify} />
              )}
              {route === 'purchase' && (
                <PurchasePage onOpenNewPurchase={() => openNewPurchase()} onNotify={notify} />
              )}
              {route === 'stock' && (
                <StockPage
                  onOpenAddStock={() => setAddStockModalOpen(true)}
                  onOpenNewPurchase={(itemId) => openNewPurchase(itemId)}
                />
              )}
              {route === 'reports' && <ReportsPage onNotify={(msg) => notify(msg)} />}
            </>
          )}
        </main>
      </div>

      <CreateSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        defaultItemId={saleDefaultItemId}
        onSuccess={(msg) => notify(msg, 'success')}
      />
      <CreatePurchaseModal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        defaultItemId={purchaseDefaultItemId}
        onSuccess={(msg) => notify(msg, 'success')}
      />
      <AddStockItemModal
        open={addStockModalOpen}
        onClose={() => setAddStockModalOpen(false)}
        onSuccess={(msg) => notify(msg, 'success')}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 text-xs font-medium rounded-lg border shadow-lg max-w-md ${
            toast.tone === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <InventoryWorkspace />
    </InventoryProvider>
  );
}
