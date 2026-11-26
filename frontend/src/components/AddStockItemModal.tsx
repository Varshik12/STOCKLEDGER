import React, { useEffect, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CATEGORY_OPTIONS, GODOWN_OPTIONS } from '../lib/constants';
import { Modal } from './Modal';

interface AddStockItemModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function AddStockItemModal({ open, onClose, onSuccess }: AddStockItemModalProps) {
  const { addStockItem } = useInventory();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [godown, setGodown] = useState<string>(GODOWN_OPTIONS[0]);
  const [quantity, setQuantity] = useState('20');
  const [minLevel, setMinLevel] = useState('10');
  const [unitPrice, setUnitPrice] = useState('149.00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setSku('');
      setCategory(CATEGORY_OPTIONS[0]);
      setGodown(GODOWN_OPTIONS[0]);
      setQuantity('20');
      setMinLevel('10');
      setUnitPrice('149.00');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await addStockItem({
      name,
      sku,
      category,
      godown,
      quantity: Number.parseInt(quantity, 10) || 0,
      minLevel: Number.parseInt(minLevel, 10) || 0,
      unitPrice: Number.parseFloat(unitPrice) || 0,
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
      title="Add Inventory Item"
      subtitle="Register a new SKU and assign its warehouse godown location."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="item-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 48-Port PoE+ Core Switch"
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="item-sku" className="block text-xs font-medium text-slate-700 mb-1.5">
              SKU Code
            </label>
            <input
              id="item-sku"
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. NET-POE48-CR"
              className="w-full h-10 px-3 text-sm font-mono uppercase bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="item-category" className="block text-xs font-medium text-slate-700 mb-1.5">
              Category
            </label>
            <select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-godown" className="block text-xs font-medium text-slate-700 mb-1.5">
              Godown / Location
            </label>
            <select
              id="item-godown"
              value={godown}
              onChange={(e) => setGodown(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            >
              {GODOWN_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="item-qty" className="block text-xs font-medium text-slate-700 mb-1.5">
              Initial Qty
            </label>
            <input
              id="item-qty"
              type="number"
              min={0}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="item-min" className="block text-xs font-medium text-slate-700 mb-1.5">
              Min Level
            </label>
            <input
              id="item-min"
              type="number"
              min={0}
              step={1}
              required
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div>
            <label htmlFor="item-price" className="block text-xs font-medium text-slate-700 mb-1.5">
              Unit Price ($)
            </label>
            <input
              id="item-price"
              type="number"
              min={0}
              step="0.01"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
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
            {submitting ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
