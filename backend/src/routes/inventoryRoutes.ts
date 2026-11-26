import { Router } from 'express';
import { inventoryStore } from '../store/inventoryStore.js';

export const inventoryRouter = Router();

inventoryRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'stockledger-backend',
    timestamp: new Date().toISOString(),
  });
});

inventoryRouter.get('/inventory/state', (_req, res) => {
  res.json(inventoryStore.getFullState());
});

inventoryRouter.get('/dashboard/summary', (_req, res) => {
  res.json(inventoryStore.getDashboardSummary());
});

inventoryRouter.get('/stock', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const godown = typeof req.query.godown === 'string' ? req.query.godown : undefined;
  res.json({ items: inventoryStore.listStockItems({ search, status, godown }) });
});

inventoryRouter.post('/stock', (req, res, next) => {
  try {
    const result = inventoryStore.addStockItem(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get('/movements', (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  res.json({ movements: inventoryStore.listMovements({ type, search }) });
});

inventoryRouter.get('/sales', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  res.json({ salesOrders: inventoryStore.listSalesOrders({ status, search }) });
});

inventoryRouter.post('/sales', (req, res, next) => {
  try {
    const result = inventoryStore.createSalesOrder(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.patch('/sales/:id/complete', (req, res, next) => {
  try {
    const result = inventoryStore.completeSalesOrder(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get('/purchases', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  res.json({ purchaseOrders: inventoryStore.listPurchaseOrders({ status, search }) });
});

inventoryRouter.post('/purchases', (req, res, next) => {
  try {
    const result = inventoryStore.createPurchaseOrder(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.patch('/purchases/:id/receive', (req, res, next) => {
  try {
    const result = inventoryStore.receivePurchaseOrder(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get('/reports/:type', (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json(inventoryStore.getReport(req.params.type, status));
  } catch (err) {
    next(err);
  }
});

inventoryRouter.post('/reset', (_req, res) => {
  res.json(inventoryStore.resetDemoData());
});
