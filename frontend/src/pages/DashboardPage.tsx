import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDateTime, formatNumber } from '../lib/formatters';
import { ModuleRoute } from '../types/inventory';

interface DashboardPageProps {
  onNavigate: (route: ModuleRoute) => void;
  onOpenNewSale: (itemId?: string) => void;
  onOpenNewPurchase: (itemId?: string) => void;
  onOpenAddStock: () => void;
}

export function DashboardPage({
  onNavigate,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenAddStock,
}: DashboardPageProps) {
  const {
    items,
    lowStockItems,
    totalStockValue,
    totalStockUnits,
    completedSalesRevenue,
    completedSalesCount,
    pendingPurchaseCount,
    pendingPurchaseValue,
    movements,
  } = useInventory();

  const recentMovements = movements.slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Operations Overview
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live inventory valuation, fulfillment velocity, and reorder thresholds across all godowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenNewSale()}
            className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Sale</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewPurchase()}
            className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Truck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Purchase</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddStock}
            className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add SKU</span>
          </button>
        </div>
      </div>

      <section
        aria-label="Key Performance Indicators"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Stock Value</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-slate-900">
            {formatCurrency(totalStockValue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {formatNumber(totalStockUnits)} units · {items.length} active SKUs
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Completed Sales</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-slate-900">
            {formatCurrency(completedSalesRevenue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {completedSalesCount} fulfilled orders
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Low Stock Alerts</p>
          <p
            className={`mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight ${
              lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {lowStockItems.length}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {lowStockItems.length > 0
              ? 'SKUs at or below min threshold'
              : 'All SKUs above minimum level'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Pending Purchase Orders</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-slate-900">
            {pendingPurchaseCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {formatCurrency(pendingPurchaseValue)} awaiting receipt
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h2>
              <p className="text-xs text-slate-500">
                Items at or below minimum stock level requiring replenishment
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stock')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              <span>View Stock</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">All inventory levels are healthy</p>
              <p className="mt-1 text-xs text-slate-500">
                No SKUs are currently at or below their minimum stock threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                    <th className="py-2.5 px-5">Item & SKU</th>
                    <th className="py-2.5 px-4">Godown</th>
                    <th className="py-2.5 px-4 text-right">Available</th>
                    <th className="py-2.5 px-4 text-right">Min Level</th>
                    <th className="py-2.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {lowStockItems.map((item) => {
                    const deficit = Math.max(0, item.minLevel - item.quantity);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs font-mono text-slate-500">
                            {item.sku} · {item.category}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {item.godown}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-rose-600">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {item.minLevel}
                          {deficit > 0 && (
                            <span className="block text-[11px] text-rose-600">
                              -{deficit} short
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenNewPurchase(item.id)}
                            className="inline-flex items-center h-8 px-3 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap"
                          >
                            Reorder PO
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Stock Movements</h2>
              <p className="text-xs text-slate-500">
                Latest IN receipts and OUT fulfillments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stock')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900">No stock movements recorded</p>
              <p className="mt-1 text-xs text-slate-500">
                Create a sales order or receive a purchase order to log movements.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentMovements.map((mov) => {
                const isIn = mov.type === 'IN';
                return (
                  <li key={mov.id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isIn ? (
                            <ArrowDownLeft
                              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowUpRight
                              className="w-3.5 h-3.5 text-rose-600 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {mov.itemName}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">
                          <span className="font-mono text-slate-700">{mov.reference}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{mov.note}</span>
                        </p>
                        <p className="mt-1 text-[11px] font-mono tabular-nums text-slate-400">
                          {formatDateTime(mov.timestamp)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-mono font-semibold tabular-nums ${
                            isIn ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIn ? '+' : '-'}
                          {mov.quantity}
                        </span>
                        <span className="block text-[11px] font-mono tabular-nums text-slate-400">
                          {mov.previousQty} → {mov.newQty}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
