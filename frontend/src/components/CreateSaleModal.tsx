import React, { useEffect, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, getTodayInputDate } from '../lib/formatters';
import { SalesOrderStatus } from '../types/inventory';
import { Modal } from './Modal';

interface CreateSaleModalProps {
  open: boolean;
  onClose: () => void;
  defaultItemId?: string;
  onSuccess?: (message: string) => void;
}

export function CreateSaleModal({
  open,
  onClose,
  defaultItemId,
  onSuccess,
}: CreateSaleModalProps) {
  const { items, createSalesOrder } = useInventory();
  const [customer, setCustomer] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [date, setDate] = useState(getTodayInputDate());
  const [status, setStatus] = useState<SalesOrderStatus>('Completed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCustomer('');
      setItemId(defaultItemId || items[0]?.id || '');
      setQuantity('1');
      setDate(getTodayInputDate());
      setStatus('Completed');
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultItemId, items]);

  const selectedItem = items.find((i) => i.id === itemId);
  const parsedQty = Number.parseInt(quantity, 10) || 0;
  const estimatedTotal = selectedItem ? parsedQty * selectedItem.unitPrice : 0;
  const exceedsStock = selectedItem ? parsedQty > selectedItem.quantity : false;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await createSalesOrder({
      customer,
      itemId,
      quantity: parsedQty,
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
      title="New Sales Order"
      subtitle="Create a customer invoice. Completing an order deducts stock immediately."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="sale-customer" className="block text-xs font-medium text-slate-700 mb-1.5">
            Customer Name
          </label>
          <input
            id="sale-customer"
            type="text"
            required
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Horizon Data Centers"
            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        <div>
          <label htmlFor="sale-item" className="block text-xs font-medium text-slate-700 mb-1.5">
            Inventory Item
          </label>
          <select
            id="sale-item"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku}) — {item.quantity} avail · {formatCurrency(item.unitPrice)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sale-qty" className="block text-xs font-medium text-slate-700 mb-1.5">
              Quantity
            </label>
            <input
              id="sale-qty"
              type="number"
              min={1}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
            {selectedItem && (
              <p
                className={`mt-1 text-xs tabular-nums ${
                  exceedsStock ? 'text-rose-600 font-medium' : 'text-slate-500'
                }`}
              >
                Available: {selectedItem.quantity} units
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sale-date" className="block text-xs font-medium text-slate-700 mb-1.5">
              Order Date
            </label>
            <input
              id="sale-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1.5">Order Status</span>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setStatus('Completed')}
              className={`h-9 text-xs font-medium rounded transition-colors ${
                status === 'Completed'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed (Deduct Stock)
            </button>
            <button
              type="button"
              onClick={() => setStatus('Pending')}
              className={`h-9 text-xs font-medium rounded transition-colors ${
                status === 'Pending'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending (Reserve Later)
            </button>
          </div>
        </div>

        {exceedsStock && status === 'Completed' && (
          <p className="text-xs text-rose-600 font-medium">
            Requested quantity exceeds available stock. Reduce quantity or save as Pending until restocked.
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div>
            <span className="text-xs text-slate-500">Order Total</span>
            <p className="text-base font-semibold font-mono tabular-nums text-slate-900">
              {formatCurrency(estimatedTotal)}
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
              disabled={submitting || (status === 'Completed' && exceedsStock)}
              className="h-10 px-4 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving...' : 'Create Sales Order'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
