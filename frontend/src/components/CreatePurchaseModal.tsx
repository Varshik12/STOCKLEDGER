import React, { useEffect, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, getTodayInputDate } from '../lib/formatters';
import { PurchaseOrderStatus } from '../types/inventory';
import { Modal } from './Modal';

interface CreatePurchaseModalProps {
  open: boolean;
  onClose: () => void;
  defaultItemId?: string;
  onSuccess?: (message: string) => void;
}

export function CreatePurchaseModal({
  open,
  onClose,
  defaultItemId,
  onSuccess,
}: CreatePurchaseModalProps) {
  const { items, createPurchaseOrder } = useInventory();
  const [supplier, setSupplier] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('15');
  const [unitCost, setUnitCost] = useState('');
  const [date, setDate] = useState(getTodayInputDate());
  const [status, setStatus] = useState<PurchaseOrderStatus>('Pending');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const targetId = defaultItemId || items[0]?.id || '';
      const targetItem = items.find((i) => i.id === targetId);
      setSupplier('');
      setItemId(targetId);
      const suggestedQty = targetItem
        ? Math.max(10, targetItem.minLevel * 2 - targetItem.quantity)
        : 15;
      setQuantity(String(suggestedQty));
      setUnitCost(targetItem ? String(Number((targetItem.unitPrice * 0.75).toFixed(2))) : '0');
      setDate(getTodayInputDate());
      setStatus('Pending');
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultItemId, items]);

  const handleItemChange = (nextId: string) => {
    setItemId(nextId);
    const nextItem = items.find((i) => i.id === nextId);
    if (nextItem) {
      setUnitCost(String(Number((nextItem.unitPrice * 0.75).toFixed(2))));
    }
  };

  const parsedQty = Number.parseInt(quantity, 10) || 0;
  const parsedCost = Number.parseFloat(unitCost) || 0;
  const totalAmount = parsedQty * parsedCost;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await createPurchaseOrder({
      supplier,
      itemId,
      quantity: parsedQty,
      unitCost: parsedCost,
      date,
      status,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    onSuccess?.(result.message);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Purchase Order"
      subtitle="Log a supplier order. Marking it Received adds stock immediately."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="po-supplier" className="block text-xs font-medium text-slate-700 mb-1.5">
            Supplier Name
          </label>
          <input
            id="po-supplier"
            type="text"
            required
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Apex NetSystems Supply"
            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        <div>
          <label htmlFor="po-item" className="block text-xs font-medium text-slate-700 mb-1.5">
            Inventory Item
          </label>
          <select
            id="po-item"
            value={itemId}
            onChange={(e) => handleItemChange(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku}) — In stock: {item.quantity} (Min: {item.minLevel})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="po-qty" className="block text-xs font-medium text-slate-700 mb-1.5">
              Quantity
            </label>
            <input
              id="po-qty"
              type="number"
              min={1}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="po-cost" className="block text-xs font-medium text-slate-700 mb-1.5">
              Unit Cost ($)
            </label>
            <input
              id="po-cost"
              type="number"
              min={0}
              step="0.01"
              required
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="po-date" className="block text-xs font-medium text-slate-700 mb-1.5">
              Order Date
            </label>
            <input
              id="po-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1.5">Receipt Status</span>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setStatus('Pending')}
              className={`h-9 text-xs font-medium rounded transition-colors ${
                status === 'Pending'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Delivery
            </button>
            <button
              type="button"
              onClick={() => setStatus('Received')}
              className={`h-9 text-xs font-medium rounded transition-colors ${
                status === 'Received'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Received (Add Stock)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div>
            <span className="text-xs text-slate-500">PO Total</span>
            <p className="text-base font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Create Purchase Order'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
