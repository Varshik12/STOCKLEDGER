import { AlertCircle, Check, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatDate } from '../lib/formatters';
import { SalesOrderStatus } from '../types/inventory';

interface SalesPageProps {
  onOpenNewSale: () => void;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

export function SalesPage({ onOpenNewSale, onNotify }: SalesPageProps) {
  const { salesOrders, items, completeSalesOrder } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SalesOrderStatus>('All');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.id, item.quantity);
    }
    return map;
  }, [items]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return salesOrders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        order.invoiceNumber.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.itemName.toLowerCase().includes(query) ||
        order.sku.toLowerCase().includes(query)
      );
    });
  }, [salesOrders, search, statusFilter]);

  const metrics = useMemo(() => {
    const completed = salesOrders.filter((o) => o.status === 'Completed');
    const pending = salesOrders.filter((o) => o.status === 'Pending');
    return {
      completedRevenue: completed.reduce((sum, o) => sum + o.totalAmount, 0),
      completedCount: completed.length,
      pendingValue: pending.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingCount: pending.length,
    };
  }, [salesOrders]);

  const handleFulfill = async (orderId: string) => {
    setInlineError(null);
    setBusyOrderId(orderId);
    const result = await completeSalesOrder(orderId);
    setBusyOrderId(null);

    if (!result.ok) {
      setInlineError(result.message);
      onNotify(result.message, 'error');
      return;
    }
    onNotify(result.message, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sales Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Track customer invoices and fulfill pending orders with automatic stock deduction.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSale}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New Sales Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Total Orders</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
            {salesOrders.length}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Completed Revenue</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-emerald-700">
            {formatCurrency(metrics.completedRevenue)}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              ({metrics.completedCount} orders)
            </span>
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Pending Fulfillment</p>
          <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-amber-700">
            {formatCurrency(metrics.pendingValue)}
            <span className="ml-2 text-xs font-sans font-normal text-slate-500">
              ({metrics.pendingCount} orders)
            </span>
          </p>
        </div>
      </div>

      {inlineError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{inlineError}</span>
        </div>
      )}

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
              placeholder="Search invoice, customer, SKU..."
              aria-label="Search sales orders"
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto">
            {(['All', 'Completed', 'Pending'] as const).map((tab) => (
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
            <p className="text-sm font-medium text-slate-900">No matching sales orders</p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust your search query or create a new customer sales order.
            </p>
            <button
              type="button"
              onClick={onOpenNewSale}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Sales Order</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredOrders.map((order) => {
                  const availableQty = stockMap.get(order.itemId) ?? 0;
                  const canFulfill = order.status === 'Pending' && availableQty >= order.quantity;
                  const isBusy = busyOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                        {order.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {order.customer}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900">{order.itemName}</div>
                        <div className="text-xs font-mono text-slate-500">
                          {order.sku} · {availableQty} in stock
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                        {order.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                        {formatDate(order.date)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={order.status} />
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {order.status === 'Pending' ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleFulfill(order.id)}
                            title={
                              canFulfill
                                ? 'Fulfill order and deduct stock'
                                : `Insufficient stock (${availableQty} available)`
                            }
                            className={`inline-flex items-center gap-1 h-8 px-3 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                              canFulfill
                                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                                : 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isBusy ? 'Processing...' : 'Mark Completed'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Fulfilled</span>
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
