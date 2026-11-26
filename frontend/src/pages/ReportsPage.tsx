import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { useInventory } from '../context/InventoryContext';
import { downloadCsv } from '../lib/csv';
import { formatCurrency, formatDate, formatNumber, getStockStatus, getTodayInputDate } from '../lib/formatters';
import { ReportTab } from '../types/inventory';

interface ReportsPageProps {
  onNotify: (message: string) => void;
}

export function ReportsPage({ onNotify }: ReportsPageProps) {
  const { items, salesOrders, purchaseOrders } = useInventory();
  const [activeReport, setActiveReport] = useState<ReportTab>('stock');
  const [stockFilter, setStockFilter] = useState<'All' | 'Healthy' | 'Low Stock'>('All');
  const [salesFilter, setSalesFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [purchaseFilter, setPurchaseFilter] = useState<'All' | 'Received' | 'Pending'>('All');

  const filteredStock = useMemo(() => {
    if (stockFilter === 'All') return items;
    return items.filter((item) => getStockStatus(item) === stockFilter);
  }, [items, stockFilter]);

  const filteredSales = useMemo(() => {
    if (salesFilter === 'All') return salesOrders;
    return salesOrders.filter((o) => o.status === salesFilter);
  }, [salesOrders, salesFilter]);

  const filteredPurchases = useMemo(() => {
    if (purchaseFilter === 'All') return purchaseOrders;
    return purchaseOrders.filter((p) => p.status === purchaseFilter);
  }, [purchaseOrders, purchaseFilter]);

  const handleExportCsv = () => {
    const stamp = getTodayInputDate();

    if (activeReport === 'stock') {
      downloadCsv(
        `stock-report-${stamp}.csv`,
        ['SKU', 'Item Name', 'Category', 'Godown', 'Available Qty', 'Min Level', 'Unit Price', 'Total Value', 'Status'],
        filteredStock.map((item) => [
          item.sku,
          item.name,
          item.category,
          item.godown,
          item.quantity,
          item.minLevel,
          item.unitPrice.toFixed(2),
          (item.quantity * item.unitPrice).toFixed(2),
          getStockStatus(item),
        ])
      );
      onNotify(`Exported Stock Report (${filteredStock.length} rows).`);
      return;
    }

    if (activeReport === 'sales') {
      downloadCsv(
        `sales-report-${stamp}.csv`,
        ['Invoice Number', 'Date', 'Customer', 'SKU', 'Item Name', 'Quantity', 'Unit Price', 'Total Amount', 'Status'],
        filteredSales.map((order) => [
          order.invoiceNumber,
          order.date,
          order.customer,
          order.sku,
          order.itemName,
          order.quantity,
          order.unitPrice.toFixed(2),
          order.totalAmount.toFixed(2),
          order.status,
        ])
      );
      onNotify(`Exported Sales Report (${filteredSales.length} rows).`);
      return;
    }

    downloadCsv(
      `purchase-report-${stamp}.csv`,
      ['PO Number', 'Date', 'Supplier', 'SKU', 'Item Name', 'Quantity', 'Unit Cost', 'Total Amount', 'Status'],
      filteredPurchases.map((po) => [
        po.poNumber,
        po.date,
        po.supplier,
        po.sku,
        po.itemName,
        po.quantity,
        po.unitCost.toFixed(2),
        po.totalAmount.toFixed(2),
        po.status,
      ])
    );
    onNotify(`Exported Purchase Report (${filteredPurchases.length} rows).`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Reports & Export</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Audit-ready inventory valuation, sales fulfillment, and procurement reports with CSV export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md self-start">
          {(
            [
              { id: 'stock', label: 'Stock Report' },
              { id: 'sales', label: 'Sales Report' },
              { id: 'purchase', label: 'Purchase Report' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeReport === 'stock' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md self-start sm:self-auto">
            {(['All', 'Healthy', 'Low Stock'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStockFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  stockFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}

        {activeReport === 'sales' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md self-start sm:self-auto">
            {(['All', 'Completed', 'Pending'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSalesFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  salesFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}

        {activeReport === 'purchase' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-md self-start sm:self-auto">
            {(['All', 'Received', 'Pending'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setPurchaseFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  purchaseFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeReport === 'stock' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">SKUs Included</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {filteredStock.length}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Total Units</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatNumber(filteredStock.reduce((s, i) => s + i.quantity, 0))}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Filtered Stock Valuation</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(filteredStock.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}
            </p>
          </div>
        </div>
      )}

      {activeReport === 'sales' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Sales Orders</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {filteredSales.length}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Units Sold</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatNumber(filteredSales.reduce((s, o) => s + o.quantity, 0))}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Gross Sales Value</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(filteredSales.reduce((s, o) => s + o.totalAmount, 0))}
            </p>
          </div>
        </div>
      )}

      {activeReport === 'purchase' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Purchase Orders</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {filteredPurchases.length}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Units Ordered</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatNumber(filteredPurchases.reduce((s, p) => s + p.quantity, 0))}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-slate-500">Total Procurement Cost</p>
            <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(filteredPurchases.reduce((s, p) => s + p.totalAmount, 0))}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {activeReport === 'stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">SKU</th>
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Godown</th>
                  <th className="py-2.5 px-4 text-right">Available</th>
                  <th className="py-2.5 px-4 text-right">Min Level</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total Value</th>
                  <th className="py-2.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {item.godown}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {item.minLevel}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                    <td className="py-3 px-5">
                      <StatusIndicator status={getStockStatus(item)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">Invoice #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredSales.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      {order.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDate(order.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{order.customer}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900">{order.itemName}</div>
                      <div className="text-xs font-mono text-slate-500">{order.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {order.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(order.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-5">
                      <StatusIndicator status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'purchase' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">PO #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDate(po.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{po.supplier}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900">{po.itemName}</div>
                      <div className="text-xs font-mono text-slate-500">{po.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {po.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(po.unitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3 px-5">
                      <StatusIndicator status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
