import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { useInventory } from '../context/InventoryContext';
import { GODOWN_OPTIONS } from '../lib/constants';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  getStockStatus,
} from '../lib/formatters';
import { MovementType, StockHealthStatus } from '../types/inventory';

interface StockPageProps {
  onOpenAddStock: () => void;
  onOpenNewPurchase: (itemId: string) => void;
}

export function StockPage({ onOpenAddStock, onOpenNewPurchase }: StockPageProps) {
  const { items, movements, totalStockValue, totalStockUnits, lowStockItems } = useInventory();
  const [activeTab, setActiveTab] = useState<'items' | 'ledger'>('items');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StockHealthStatus>('All');
  const [godownFilter, setGodownFilter] = useState<string>('All');
  const [movementFilter, setMovementFilter] = useState<'All' | MovementType>('All');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const status = getStockStatus(item);
      if (statusFilter !== 'All' && status !== statusFilter) {
        return false;
      }
      if (godownFilter !== 'All' && item.godown !== godownFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.godown.toLowerCase().includes(query)
      );
    });
  }, [items, search, statusFilter, godownFilter]);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movements.filter((mov) => {
      if (movementFilter !== 'All' && mov.type !== movementFilter) {
        return false;
      }
      if (!query) return true;
      return (
        mov.itemName.toLowerCase().includes(query) ||
        mov.sku.toLowerCase().includes(query) ||
        mov.reference.toLowerCase().includes(query) ||
        mov.note.toLowerCase().includes(query)
      );
    });
  }, [movements, search, movementFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Stock & Ledger
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Monitor SKU availability across godowns and inspect the complete IN/OUT audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddStock}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add Item / SKU</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Total Inventory Valuation</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(totalStockValue)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Units on Hand</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
            {formatNumber(totalStockUnits)}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              across {items.length} SKUs
            </span>
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Low Stock Threshold</p>
          <p
            className={`mt-1 text-xl font-semibold font-mono tabular-nums ${
              lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {lowStockItems.length}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              items needing reorder
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === 'items'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory Items ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movement Ledger ({movements.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'items'
                    ? 'Search item, SKU, godown...'
                    : 'Search reference, SKU, note...'
                }
                aria-label="Search stock records"
                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            {activeTab === 'items' ? (
              <>
                <select
                  aria-label="Filter by godown"
                  value={godownFilter}
                  onChange={(e) => setGodownFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="All">All Godowns</option>
                  {GODOWN_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  {(['All', 'Healthy', 'Low Stock'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        statusFilter === tab
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                {(['All', 'IN', 'OUT'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMovementFilter(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      movementFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'items' ? (
          filteredItems.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-900">No inventory items match</p>
              <p className="mt-1 text-xs text-slate-500">
                Clear filters or add a new SKU to the warehouse catalog.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                    <th className="py-2.5 px-5">Item & Category</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Godown / Location</th>
                    <th className="py-2.5 px-4 text-right">Available</th>
                    <th className="py-2.5 px-4 text-right">Min Level</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    const isLow = status === 'Low Stock';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-5">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {item.godown}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          {item.minLevel}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusIndicator status={status} />
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          {isLow ? (
                            <button
                              type="button"
                              onClick={() => onOpenNewPurchase(item.id)}
                              className="inline-flex items-center h-8 px-3 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                            >
                              Restock PO
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : filteredMovements.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">No stock movements found</p>
            <p className="mt-1 text-xs text-slate-500">
              Stock IN and OUT movements appear automatically as orders are processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">Type</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4 text-right">Qty Change</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredMovements.map((mov) => {
                  const isIn = mov.type === 'IN';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <StatusIndicator status={mov.type} />
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                        {mov.reference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900">{mov.itemName}</div>
                        <div className="text-xs font-mono text-slate-500">{mov.sku}</div>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                          isIn ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIn ? '+' : '-'}
                        {mov.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                        {mov.previousQty} → <span className="font-semibold text-slate-900">{mov.newQty}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {mov.note}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-xs tabular-nums text-slate-500 whitespace-nowrap">
                        {formatDateTime(mov.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
