# StockLedger — Backend API (`backend/`)

This is the standalone **Node.js + Express + TypeScript** backend for the StockLedger Inventory Management System. It contains only backend server code and has zero dependency on files outside the `backend/` folder.

---

## 1. Project Overview & Connected Workflow

The backend enforces all core inventory business rules and persists state to `backend/data/inventory-db.json` (auto-initialized from realistic sample data on first run):

- **Purchase Order Receipt (`Received`)**: Increases the linked SKU's stock quantity immediately and records an `IN` entry in the stock movement ledger.
- **Sales Order Completion (`Completed`)**: Validates that requested quantity does not exceed available stock (prevents overselling with HTTP `400`), deducts the item's quantity, and records an `OUT` entry in the stock movement ledger.
- **Automatic Low Stock Detection**: Any SKU where `quantity <= minLevel` is automatically flagged as `Low Stock` and surfaced in dashboard summaries and stock reports.
- **Opening Stock Audit**: Creating a new SKU with initial stock `> 0` logs an `OPENING-STOCK` `IN` movement.

---

## 2. Folder Structure & What Each File Does

```text
backend/
├── .env.example              # Environment variable template (PORT, CORS_ORIGIN)
├── .gitignore                # Ignores node_modules, dist, .env, and runtime data/
├── package.json              # Backend dependencies and build/start scripts
├── tsconfig.json             # TypeScript compiler configuration (NodeNext ESM -> dist/)
├── README.md                 # Backend documentation, API reference, and Render deploy guide
└── src/
    ├── server.ts             # Express app entrypoint: loads .env, sets up CORS & JSON middleware, mounts /api routes, and handles errors
    ├── types/
    │   └── inventory.ts      # TypeScript interfaces for StockItem, SalesOrder, PurchaseOrder, StockMovement, and request payloads
    ├── data/
    │   └── seedData.ts       # Realistic initial sample records (10 SKUs, 8 sales orders, 7 purchase orders, 9 movement logs)
    ├── store/
    │   └── inventoryStore.ts # Core business logic, oversell validation, sequential INV/PO numbering, and JSON file persistence
    └── routes/
        └── inventoryRoutes.ts # Express Router mapping all REST API endpoints to inventoryStore methods
```

---

## 3. Libraries & Laptop Setup

### Prerequisites
- **Node.js** `v18+` or `v20+` (includes `npm`)

### Libraries Installed via `npm install`
- **Runtime Dependencies**:
  - `express` — HTTP server and REST API routing
  - `dotenv` — Loads environment variables from `.env`
- **Development / Build Dependencies**:
  - `typescript` — TypeScript compiler (`tsc`)
  - `tsx` — Runs TypeScript directly with file watching in development
  - `@types/express`, `@types/node` — TypeScript type definitions

### Run Locally on Your Laptop
1. Open a terminal inside the `backend` folder:
   ```bash
   cd backend
   ```
2. Install all required libraries:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
4. Start the development server:
   ```bash
   npm run dev
   ```
   The API will run at `http://localhost:5000` (test `http://localhost:5000/api/health`).

---

## 4. Complete Backend API Endpoints

Base URL locally: `http://localhost:5000/api`

| Method | Endpoint | Description | Query / Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check for monitoring and Render | None |
| `GET` | `/api/inventory/state` | Returns complete state (`items`, `salesOrders`, `purchaseOrders`, `movements`) | None |
| `GET` | `/api/dashboard/summary` | Returns KPI totals, `lowStockItems`, and `recentMovements` | None |
| `GET` | `/api/stock` | List inventory items with optional filters | `?search=&status=Healthy\|Low Stock&godown=` |
| `POST` | `/api/stock` | Add a new SKU / inventory item | `{ name, sku, category, godown, quantity, minLevel, unitPrice }` |
| `GET` | `/api/movements` | List IN/OUT stock movement ledger | `?type=IN\|OUT&search=` |
| `GET` | `/api/sales` | List sales orders / invoices | `?status=Completed\|Pending&search=` |
| `POST` | `/api/sales` | Create a sales order (deducts stock if `Completed`) | `{ customer, itemId, quantity, date, status }` |
| `PATCH` | `/api/sales/:id/complete` | Fulfill a `Pending` sales order and deduct stock | URL param `:id` |
| `GET` | `/api/purchases` | List purchase orders | `?status=Received\|Pending&search=` |
| `POST` | `/api/purchases` | Create a purchase order (adds stock if `Received`) | `{ supplier, itemId, quantity, unitCost, date, status }` |
| `PATCH` | `/api/purchases/:id/receive` | Mark a `Pending` PO as `Received` and add stock | URL param `:id` |
| `GET` | `/api/reports/:type` | Get report summary & rows (`stock`, `sales`, `purchase`) | `?status=` |
| `POST` | `/api/reset` | Restore database back to initial sample records | None |

### Example Error Response (Overselling Prevented — HTTP `400`)
```json
{
  "ok": false,
  "message": "Cannot complete sale: requested 20 units of PWR-UPS-1500, but only 6 available."
}
```

---

## 5. How to Deploy Backend on Render

1. Push your project (containing the `backend/` folder) to a GitHub repository.
2. Log in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository and configure the service:
   - **Name**: `stockledger-backend`
   - **Root Directory**: `backend`
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables under **Environment**:
   - `CORS_ORIGIN`: Your deployed frontend URL (e.g. `https://stockledger-frontend.onrender.com`), or `*` while testing.
   - *(Note: Render automatically sets `PORT`, so you do not need to set `PORT` manually.)*
5. Click **Create Web Service**.
6. Once deployed, copy your live backend URL (e.g. `https://stockledger-backend.onrender.com`) and verify `https://stockledger-backend.onrender.com/api/health` returns `{ "ok": true }`.
7. Set `VITE_API_URL=https://stockledger-backend.onrender.com/api` in your frontend's Render/Vercel environment variables so the frontend connects to this backend.

> **Note on Render Free Tier Persistence**: Render's free Web Service filesystem is ephemeral across container restarts/redeploys. For permanent cloud database storage in production, replace the JSON file persistence in `src/store/inventoryStore.ts` with PostgreSQL or MongoDB.
