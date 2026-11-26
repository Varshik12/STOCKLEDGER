import {
  CreatePurchaseOrderInput,
  CreateSalesOrderInput,
  CreateStockItemInput,
  InventoryDatabaseState,
} from '../types/inventory';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

interface MutationResponse {
  message: string;
  state: InventoryDatabaseState;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const inventoryApi = {
  getState: () => request<InventoryDatabaseState>('/inventory/state'),

  createSalesOrder: (input: CreateSalesOrderInput) =>
    request<MutationResponse>('/sales', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  completeSalesOrder: (orderId: string) =>
    request<MutationResponse>(`/sales/${encodeURIComponent(orderId)}/complete`, {
      method: 'PATCH',
    }),

  createPurchaseOrder: (input: CreatePurchaseOrderInput) =>
    request<MutationResponse>('/purchases', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  receivePurchaseOrder: (poId: string) =>
    request<MutationResponse>(`/purchases/${encodeURIComponent(poId)}/receive`, {
      method: 'PATCH',
    }),

  addStockItem: (input: CreateStockItemInput) =>
    request<MutationResponse>('/stock', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  resetDemoData: () =>
    request<MutationResponse>('/reset', {
      method: 'POST',
    }),
};
