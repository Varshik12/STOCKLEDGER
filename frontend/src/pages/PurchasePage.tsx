import { Check, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate } from '../lib/formatters';
import { PurchaseOrderStatus } from '../types/inventory';

interface PurchasePageProps {
  onOpenNewPurchase: () => void;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

export function PurchasePage({ onOpenNewPurchase, onNotify }: PurchasePageProps) {
  const { purchaseOrders, receivePurchaseOrder } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseOrderStatus>('All');
  const [busyPoId, setBusyPoId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return purchaseOrders.filter((po) => {
      if (statusFilter !== 'All' && po.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        po.poNumber.toLowerCase().includes(query) ||
        po.supplier.toLowerCase().includes(query) ||
        po.itemName.toLowerCase().includes(query) ||
        po.sku.toLowerCase().includes(query)
      );
    });
  }, [purchaseOrders, search, statusFilter]);

  const metrics = useMemo(() => {
    const received = purchaseOrders.filter((p) => p.status === 'Received');
    const pending = purchaseOrders.filter((p) => p.status === 'Pending');
    return {
      receivedSpend: received.reduce((sum, p) => sum + p.totalAmount, 0),
      receivedCount: received.length,
      pendingSpend: pending.reduce((sum, p) => sum + p.totalAmount, 0),
      pendingCount: pending.length,
    };
  }, [purchaseOrders]);

  const handleMarkReceived = async (poId: string) => {
    setBusyPoId(poId);
    const result = await receivePurchaseOrder(poId);
    setBusyPoId(null);
    onNotify(result.message, result.ok ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Purchase Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage supplier procurement and mark incoming shipments as received to replenish stock.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewPurchase}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
            {purchaseOrders.length}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Received Procurement</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-emerald-700">
            {formatCurrency(metrics.receivedSpend)}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              ({metrics.receivedCount} POs)
            </span>
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Pending Incoming</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-amber-700">
            {formatCurrency(metrics.pendingSpend)}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              ({metrics.pendingCount} POs)
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO #, supplier, SKU..."
              aria-label="Search purchase orders"
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto">
            {(['All', 'Received', 'Pending'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">No matching purchase orders</p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust your search filter or create a new supplier purchase order.
            </p>
            <button
              type="button"
              onClick={onOpenNewPurchase}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Purchase Order</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">PO #</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredOrders.map((po) => {
                  const isBusy = busyPoId === po.id;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {po.supplier}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900">{po.itemName}</div>
                        <div className="text-xs font-mono text-slate-500">{po.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        {po.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                        {formatDate(po.date)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={po.status} />
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {po.status === 'Pending' ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleMarkReceived(po.id)}
                            className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isBusy ? 'Receiving...' : 'Mark Received'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Stock Added</span>
                        )}
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
