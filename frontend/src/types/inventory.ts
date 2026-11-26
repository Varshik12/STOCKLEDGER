export type ModuleRoute = 'dashboard' | 'sales' | 'purchase' | 'stock' | 'reports';

export type StockHealthStatus = 'Healthy' | 'Low Stock';

export type SalesOrderStatus = 'Completed' | 'Pending';

export type PurchaseOrderStatus = 'Received' | 'Pending';

export type MovementType = 'IN' | 'OUT';

export type ReportTab = 'stock' | 'sales' | 'purchase';

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  godown: string;
  quantity: number;
  minLevel: number;
  unitPrice: number;
  updatedAt: string;
}

export interface SalesOrder {
  id: string;
  invoiceNumber: string;
  customer: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
  status: SalesOrderStatus;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  date: string;
  status: PurchaseOrderStatus;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reference: string;
  note: string;
  timestamp: string;
}

export interface InventoryDatabaseState {
  items: StockItem[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
}

export interface CreateSalesOrderInput {
  customer: string;
  itemId: string;
  quantity: number;
  date: string;
  status: SalesOrderStatus;
}

export interface CreatePurchaseOrderInput {
  supplier: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  date: string;
  status: PurchaseOrderStatus;
}

export interface CreateStockItemInput {
  name: string;
  sku: string;
  category: string;
  godown: string;
  quantity: number;
  minLevel: number;
  unitPrice: number;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}
