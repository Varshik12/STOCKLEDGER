import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { inventoryApi } from '../lib/api';
import {
  ActionResult,
  CreatePurchaseOrderInput,
  CreateSalesOrderInput,
  CreateStockItemInput,
  InventoryDatabaseState,
  PurchaseOrder,
  SalesOrder,
  StockItem,
  StockMovement,
} from '../types/inventory';

interface InventoryContextValue {
  items: StockItem[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
  lowStockItems: StockItem[];
  totalStockValue: number;
  totalStockUnits: number;
  completedSalesRevenue: number;
  completedSalesCount: number;
  pendingPurchaseCount: number;
  pendingPurchaseValue: number;
  isLoading: boolean;
  loadError: string | null;
  refreshState: () => Promise<void>;
  createSalesOrder: (input: CreateSalesOrderInput) => Promise<ActionResult>;
  completeSalesOrder: (orderId: string) => Promise<ActionResult>;
  createPurchaseOrder: (input: CreatePurchaseOrderInput) => Promise<ActionResult>;
  receivePurchaseOrder: (poId: string) => Promise<ActionResult>;
  addStockItem: (input: CreateStockItemInput) => Promise<ActionResult>;
  resetDemoData: () => Promise<ActionResult>;
}

const EMPTY_STATE: InventoryDatabaseState = {
  items: [],
  salesOrders: [],
  purchaseOrders: [],
  movements: [],
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InventoryDatabaseState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const nextState = await inventoryApi.getState();
      setState(nextState);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to reach backend API. Ensure the backend server is running.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const createSalesOrder = useCallback(
    async (input: CreateSalesOrderInput): Promise<ActionResult> => {
      try {
        const result = await inventoryApi.createSalesOrder(input);
        setState(result.state);
        return { ok: true, message: result.message };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Failed to create sales order.',
        };
      }
    },
    []
  );

  const completeSalesOrder = useCallback(async (orderId: string): Promise<ActionResult> => {
    try {
      const result = await inventoryApi.completeSalesOrder(orderId);
      setState(result.state);
      return { ok: true, message: result.message };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to complete sales order.',
      };
    }
  }, []);

  const createPurchaseOrder = useCallback(
    async (input: CreatePurchaseOrderInput): Promise<ActionResult> => {
      try {
        const result = await inventoryApi.createPurchaseOrder(input);
        setState(result.state);
        return { ok: true, message: result.message };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Failed to create purchase order.',
        };
      }
    },
    []
  );

  const receivePurchaseOrder = useCallback(async (poId: string): Promise<ActionResult> => {
    try {
      const result = await inventoryApi.receivePurchaseOrder(poId);
      setState(result.state);
      return { ok: true, message: result.message };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to receive purchase order.',
      };
    }
  }, []);

  const addStockItem = useCallback(async (input: CreateStockItemInput): Promise<ActionResult> => {
    try {
      const result = await inventoryApi.addStockItem(input);
      setState(result.state);
      return { ok: true, message: result.message };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to add inventory item.',
      };
    }
  }, []);

  const resetDemoData = useCallback(async (): Promise<ActionResult> => {
    try {
      const result = await inventoryApi.resetDemoData();
      setState(result.state);
      return { ok: true, message: result.message };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to reset sample data.',
      };
    }
  }, []);

  const derived = useMemo(() => {
    const lowStockItems = state.items.filter((item) => item.quantity <= item.minLevel);
    const totalStockValue = state.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalStockUnits = state.items.reduce((sum, item) => sum + item.quantity, 0);

    const completedSales = state.salesOrders.filter((o) => o.status === 'Completed');
    const completedSalesRevenue = completedSales.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingPurchases = state.purchaseOrders.filter((po) => po.status === 'Pending');
    const pendingPurchaseValue = pendingPurchases.reduce((sum, po) => sum + po.totalAmount, 0);

    return {
      lowStockItems,
      totalStockValue,
      totalStockUnits,
      completedSalesRevenue,
      completedSalesCount: completedSales.length,
      pendingPurchaseCount: pendingPurchases.length,
      pendingPurchaseValue,
    };
  }, [state.items, state.purchaseOrders, state.salesOrders]);

  const value: InventoryContextValue = {
    items: state.items,
    salesOrders: state.salesOrders,
    purchaseOrders: state.purchaseOrders,
    movements: state.movements,
    ...derived,
    isLoading,
    loadError,
    refreshState,
    createSalesOrder,
    completeSalesOrder,
    createPurchaseOrder,
    receivePurchaseOrder,
    addStockItem,
    resetDemoData,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return ctx;
}
