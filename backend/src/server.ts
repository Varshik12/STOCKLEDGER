import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { inventoryRouter } from './routes/inventoryRoutes.js';
import { HttpError } from './store/inventoryStore.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(express.json());

// CORS middleware for separate frontend hosting (Localhost, Render, Vercel)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'StockLedger Inventory API',
    health: '/api/health',
    docs: 'See backend/README.md for all endpoints.',
  });
});

app.use('/api', inventoryRouter);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ ok: false, message: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ ok: false, message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StockLedger backend listening on http://localhost:${PORT}`);
});
