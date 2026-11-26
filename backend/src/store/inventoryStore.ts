import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSeedState } from '../data/seedData.js';
import {
  CreatePurchaseOrderInput,
  CreateSalesOrderInput,
  CreateStockItemInput,
  InventoryDatabaseState,
  PurchaseOrder,
  SalesOrder,
  StockHealthStatus,
  StockItem,
  StockMovement,
} from '../types/inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE_PATH = path.join(DATA_DIR, 'inventory-db.json');

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getStockStatus(item: Pick<StockItem, 'quantity' | 'minLevel'>): StockHealthStatus {
  return item.quantity <= item.minLevel ? 'Low Stock' : 'Healthy';
}

function nextInvoiceNumber(orders: SalesOrder[]): string {
  const maxNum = orders.reduce((acc, order) => {
    const match = order.invoiceNumber.match(/(\d+)$/);
    const num = match ? Number.parseInt(match[1], 10) : 1000;
    return Math.max(acc, num);
  }, 1048);
  return `INV-2026-${maxNum + 1}`;
}

function nextPoNumber(orders: PurchaseOrder[]): string {
  const maxNum = orders.reduce((acc, order) => {
    const match = order.poNumber.match(/(\d+)$/);
    const num = match ? Number.parseInt(match[1], 10) : 800;
    return Math.max(acc, num);
  }, 894);
  return `PO-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

class InventoryStore {
  private state: InventoryDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): InventoryDatabaseState {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<InventoryDatabaseState>;
        if (
          Array.isArray(parsed.items) &&
          Array.isArray(parsed.salesOrders) &&
          Array.isArray(parsed.purchaseOrders) &&
          Array.isArray(parsed.movements)
        ) {
          return {
            items: parsed.items,
            salesOrders: parsed.salesOrders,
            purchaseOrders: parsed.purchaseOrders,
            movements: parsed.movements,
          };
        }
      }
    } catch {
      // Fall back to fresh seed data if local JSON store cannot be read
    }

    const seeded = createSeedState();
    this.persistState(seeded);
    return seeded;
  }

  private persistState(nextState: InventoryDatabaseState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(nextState, null, 2), 'utf-8');
    } catch {
      // Continue in memory if filesystem is read-only
    }
  }

  getFullState(): InventoryDatabaseState {
    return this.state;
  }

  getDashboardSummary() {
    const lowStockItems = this.state.items.filter((item) => item.quantity <= item.minLevel);
    const totalStockValue = this.state.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalStockUnits = this.state.items.reduce((sum, item) => sum + item.quantity, 0);
    const completedSales = this.state.salesOrders.filter((o) => o.status === 'Completed');
    const pendingPurchases = this.state.purchaseOrders.filter((p) => p.status === 'Pending');

    return {
      totalStockValue: Number(totalStockValue.toFixed(2)),
      totalStockUnits,
      totalSkus: this.state.items.length,
      completedSalesRevenue: Number(
        completedSales.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
      ),
      completedSalesCount: completedSales.length,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      pendingPurchaseCount: pendingPurchases.length,
      pendingPurchaseValue: Number(
        pendingPurchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)
      ),
      recentMovements: this.state.movements.slice(0, 7),
    };
  }

  listStockItems(filters?: { search?: string; status?: string; godown?: string }): StockItem[] {
    const query = filters?.search?.trim().toLowerCase() ?? '';
    return this.state.items.filter((item) => {
      if (filters?.status && filters.status !== 'All' && getStockStatus(item) !== filters.status) {
        return false;
      }
      if (filters?.godown && filters.godown !== 'All' && item.godown !== filters.godown) {
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
  }

  addStockItem(input: CreateStockItemInput): {
    item: StockItem;
    message: string;
    state: InventoryDatabaseState;
  } {
    const name = String(input.name ?? '').trim();
    const sku = String(input.sku ?? '').trim().toUpperCase();
    const category = String(input.category ?? '').trim();
    const godown = String(input.godown ?? '').trim();
    const quantity = Number(input.quantity);
    const minLevel = Number(input.minLevel);
    const unitPrice = Number(input.unitPrice);

    if (!name || !sku || !category || !godown) {
      throw new HttpError(400, 'Name, SKU, category, and godown are required.');
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new HttpError(400, 'Initial quantity must be a non-negative integer.');
    }
    if (!Number.isInteger(minLevel) || minLevel < 0) {
      throw new HttpError(400, 'Minimum stock level must be a non-negative integer.');
    }
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      throw new HttpError(400, 'Unit price must be zero or greater.');
    }

    const exists = this.state.items.some((item) => item.sku.toUpperCase() === sku);
    if (exists) {
      throw new HttpError(409, `SKU "${sku}" already exists in inventory.`);
    }

    const nowIso = new Date().toISOString();
    const newItem: StockItem = {
      id: `item-${Date.now()}`,
      name,
      sku,
      category,
      godown,
      quantity,
      minLevel,
      unitPrice: Number(unitPrice.toFixed(2)),
      updatedAt: nowIso,
    };

    const openingMovement: StockMovement[] =
      quantity > 0
        ? [
            {
              id: `mov-${Date.now()}`,
              itemId: newItem.id,
              itemName: newItem.name,
              sku: newItem.sku,
              type: 'IN',
              quantity,
              previousQty: 0,
              newQty: quantity,
              reference: 'OPENING-STOCK',
              note: `Initial stock added at ${godown}`,
              timestamp: nowIso,
            },
          ]
        : [];

    this.state = {
      ...this.state,
      items: [newItem, ...this.state.items],
      movements: [...openingMovement, ...this.state.movements],
    };
    this.persistState(this.state);

    return {
      item: newItem,
      message: `Added ${name} (${sku}) to ${godown}.`,
      state: this.state,
    };
  }

  listMovements(filters?: { type?: string; search?: string }): StockMovement[] {
    const query = filters?.search?.trim().toLowerCase() ?? '';
    return this.state.movements.filter((mov) => {
      if (filters?.type && filters.type !== 'All' && mov.type !== filters.type) {
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
  }

  listSalesOrders(filters?: { status?: string; search?: string }): SalesOrder[] {
    const query = filters?.search?.trim().toLowerCase() ?? '';
    return this.state.salesOrders.filter((order) => {
      if (filters?.status && filters.status !== 'All' && order.status !== filters.status) {
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
  }

  createSalesOrder(input: CreateSalesOrderInput): {
    order: SalesOrder;
    message: string;
    state: InventoryDatabaseState;
  } {
    const customer = String(input.customer ?? '').trim();
    const itemId = String(input.itemId ?? '').trim();
    const quantity = Number(input.quantity);
    const date = String(input.date ?? '').trim();
    const status = input.status;

    if (!customer) {
      throw new HttpError(400, 'Customer name is required.');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, 'Order quantity must be at least 1.');
    }
    if (status !== 'Completed' && status !== 'Pending') {
      throw new HttpError(400, 'Status must be either Completed or Pending.');
    }

    const targetItem = this.state.items.find((item) => item.id === itemId);
    if (!targetItem) {
      throw new HttpError(404, 'Selected inventory item was not found.');
    }

    if (status === 'Completed' && quantity > targetItem.quantity) {
      throw new HttpError(
        400,
        `Cannot complete sale: requested ${quantity} units of ${targetItem.sku}, but only ${targetItem.quantity} available.`
      );
    }

    const invoiceNumber = nextInvoiceNumber(this.state.salesOrders);
    const nowIso = new Date().toISOString();
    const orderDate = date || nowIso.slice(0, 10);

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      invoiceNumber,
      customer,
      itemId: targetItem.id,
      itemName: targetItem.name,
      sku: targetItem.sku,
      quantity,
      unitPrice: targetItem.unitPrice,
      totalAmount: Number((quantity * targetItem.unitPrice).toFixed(2)),
      date: orderDate,
      status,
    };

    let updatedItems = this.state.items;
    let updatedMovements = this.state.movements;

    if (status === 'Completed') {
      const previousQty = targetItem.quantity;
      const newQty = previousQty - quantity;
      updatedItems = this.state.items.map((item) =>
        item.id === targetItem.id ? { ...item, quantity: newQty, updatedAt: nowIso } : item
      );
      updatedMovements = [
        {
          id: `mov-${Date.now()}`,
          itemId: targetItem.id,
          itemName: targetItem.name,
          sku: targetItem.sku,
          type: 'OUT',
          quantity,
          previousQty,
          newQty,
          reference: invoiceNumber,
          note: `Fulfilled order for ${customer}`,
          timestamp: nowIso,
        },
        ...this.state.movements,
      ];
    }

    this.state = {
      ...this.state,
      items: updatedItems,
      salesOrders: [newOrder, ...this.state.salesOrders],
      movements: updatedMovements,
    };
    this.persistState(this.state);

    return {
      order: newOrder,
      message:
        status === 'Completed'
          ? `${invoiceNumber} created and ${quantity} units deducted from ${targetItem.sku}.`
          : `${invoiceNumber} saved as Pending.`,
      state: this.state,
    };
  }

  completeSalesOrder(orderId: string): {
    order: SalesOrder;
    message: string;
    state: InventoryDatabaseState;
  } {
    const order = this.state.salesOrders.find((o) => o.id === orderId);
    if (!order) {
      throw new HttpError(404, 'Sales order not found.');
    }
    if (order.status === 'Completed') {
      throw new HttpError(400, `${order.invoiceNumber} is already completed.`);
    }

    const item = this.state.items.find((i) => i.id === order.itemId);
    if (!item) {
      throw new HttpError(404, 'Linked inventory SKU was not found.');
    }
    if (order.quantity > item.quantity) {
      throw new HttpError(
        400,
        `Insufficient stock to fulfill ${order.invoiceNumber}: needs ${order.quantity} units of ${item.sku}, only ${item.quantity} in stock.`
      );
    }

    const nowIso = new Date().toISOString();
    const previousQty = item.quantity;
    const newQty = previousQty - order.quantity;
    const updatedOrder: SalesOrder = { ...order, status: 'Completed' };

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: 'OUT',
      quantity: order.quantity,
      previousQty,
      newQty,
      reference: order.invoiceNumber,
      note: `Fulfilled order for ${order.customer}`,
      timestamp: nowIso,
    };

    this.state = {
      ...this.state,
      items: this.state.items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty, updatedAt: nowIso } : i
      ),
      salesOrders: this.state.salesOrders.map((o) => (o.id === order.id ? updatedOrder : o)),
      movements: [movement, ...this.state.movements],
    };
    this.persistState(this.state);

    return {
      order: updatedOrder,
      message: `${order.invoiceNumber} fulfilled. Deducted ${order.quantity} units of ${item.sku}.`,
      state: this.state,
    };
  }

  listPurchaseOrders(filters?: { status?: string; search?: string }): PurchaseOrder[] {
    const query = filters?.search?.trim().toLowerCase() ?? '';
    return this.state.purchaseOrders.filter((po) => {
      if (filters?.status && filters.status !== 'All' && po.status !== filters.status) {
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
  }

  createPurchaseOrder(input: CreatePurchaseOrderInput): {
    purchaseOrder: PurchaseOrder;
    message: string;
    state: InventoryDatabaseState;
  } {
    const supplier = String(input.supplier ?? '').trim();
    const itemId = String(input.itemId ?? '').trim();
    const quantity = Number(input.quantity);
    const unitCost = Number(input.unitCost);
    const date = String(input.date ?? '').trim();
    const status = input.status;

    if (!supplier) {
      throw new HttpError(400, 'Supplier name is required.');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, 'Purchase quantity must be at least 1.');
    }
    if (Number.isNaN(unitCost) || unitCost < 0) {
      throw new HttpError(400, 'Unit cost must be zero or greater.');
    }
    if (status !== 'Received' && status !== 'Pending') {
      throw new HttpError(400, 'Status must be either Received or Pending.');
    }

    const targetItem = this.state.items.find((item) => item.id === itemId);
    if (!targetItem) {
      throw new HttpError(404, 'Selected inventory item was not found.');
    }

    const poNumber = nextPoNumber(this.state.purchaseOrders);
    const nowIso = new Date().toISOString();
    const poDate = date || nowIso.slice(0, 10);

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplier,
      itemId: targetItem.id,
      itemName: targetItem.name,
      sku: targetItem.sku,
      quantity,
      unitCost: Number(unitCost.toFixed(2)),
      totalAmount: Number((quantity * unitCost).toFixed(2)),
      date: poDate,
      status,
    };

    let updatedItems = this.state.items;
    let updatedMovements = this.state.movements;

    if (status === 'Received') {
      const previousQty = targetItem.quantity;
      const newQty = previousQty + quantity;
      updatedItems = this.state.items.map((item) =>
        item.id === targetItem.id ? { ...item, quantity: newQty, updatedAt: nowIso } : item
      );
      updatedMovements = [
        {
          id: `mov-${Date.now()}`,
          itemId: targetItem.id,
          itemName: targetItem.name,
          sku: targetItem.sku,
          type: 'IN',
          quantity,
          previousQty,
          newQty,
          reference: poNumber,
          note: `Received shipment from ${supplier}`,
          timestamp: nowIso,
        },
        ...this.state.movements,
      ];
    }

    this.state = {
      ...this.state,
      items: updatedItems,
      purchaseOrders: [newPo, ...this.state.purchaseOrders],
      movements: updatedMovements,
    };
    this.persistState(this.state);

    return {
      purchaseOrder: newPo,
      message:
        status === 'Received'
          ? `${poNumber} received and ${quantity} units added to ${targetItem.sku}.`
          : `${poNumber} created as Pending.`,
      state: this.state,
    };
  }

  receivePurchaseOrder(poId: string): {
    purchaseOrder: PurchaseOrder;
    message: string;
    state: InventoryDatabaseState;
  } {
    const po = this.state.purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      throw new HttpError(404, 'Purchase order not found.');
    }
    if (po.status === 'Received') {
      throw new HttpError(400, `${po.poNumber} has already been received.`);
    }

    const item = this.state.items.find((i) => i.id === po.itemId);
    if (!item) {
      throw new HttpError(404, 'Linked inventory SKU was not found.');
    }

    const nowIso = new Date().toISOString();
    const previousQty = item.quantity;
    const newQty = previousQty + po.quantity;
    const updatedPo: PurchaseOrder = { ...po, status: 'Received' };

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: 'IN',
      quantity: po.quantity,
      previousQty,
      newQty,
      reference: po.poNumber,
      note: `Received shipment from ${po.supplier}`,
      timestamp: nowIso,
    };

    this.state = {
      ...this.state,
      items: this.state.items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty, updatedAt: nowIso } : i
      ),
      purchaseOrders: this.state.purchaseOrders.map((p) => (p.id === po.id ? updatedPo : p)),
      movements: [movement, ...this.state.movements],
    };
    this.persistState(this.state);

    return {
      purchaseOrder: updatedPo,
      message: `${po.poNumber} marked Received. Added ${po.quantity} units to ${item.sku}.`,
      state: this.state,
    };
  }

  getReport(type: string, statusFilter?: string) {
    if (type === 'stock') {
      const rows = this.listStockItems({ status: statusFilter });
      return {
        type: 'stock',
        count: rows.length,
        totalUnits: rows.reduce((s, r) => s + r.quantity, 0),
        totalValue: Number(rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0).toFixed(2)),
        rows,
      };
    }
    if (type === 'sales') {
      const rows = this.listSalesOrders({ status: statusFilter });
      return {
        type: 'sales',
        count: rows.length,
        totalUnits: rows.reduce((s, r) => s + r.quantity, 0),
        totalValue: Number(rows.reduce((s, r) => s + r.totalAmount, 0).toFixed(2)),
        rows,
      };
    }
    if (type === 'purchase') {
      const rows = this.listPurchaseOrders({ status: statusFilter });
      return {
        type: 'purchase',
        count: rows.length,
        totalUnits: rows.reduce((s, r) => s + r.quantity, 0),
        totalValue: Number(rows.reduce((s, r) => s + r.totalAmount, 0).toFixed(2)),
        rows,
      };
    }
    throw new HttpError(400, 'Invalid report type. Expected stock, sales, or purchase.');
  }

  resetDemoData(): { message: string; state: InventoryDatabaseState } {
    this.state = createSeedState();
    this.persistState(this.state);
    return {
      message: 'Sample inventory data restored.',
      state: this.state,
    };
  }
}

export const inventoryStore = new InventoryStore();
