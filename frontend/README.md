
StockLedger — Frontend Application (frontend/)
This is the standalone React + TypeScript + Vite + Tailwind CSS frontend for the StockLedger Inventory Management System. It contains only frontend UI code and communicates with the separate backend/ Express REST API.
1. Project Overview
StockLedger provides a clean SaaS operations dashboard with five connected modules and no login required:
Dashboard: Real-time KPI totals (total stock value & units, completed sales revenue, low stock count, pending POs), Low Stock Alerts table with one-click Reorder PO, and Recent Stock Movements feed.
Sales: Sales orders / invoices list with live search, All / Completed / Pending filters, order creation modal, and Mark Completed fulfillment that deducts stock while preventing overselling.
Purchase: Purchase orders list with live search, All / Received / Pending filters, PO creation modal, and Mark Received button that adds stock immediately.
Stock: Switchable views for Inventory Items (godown filter, Healthy / Low Stock filter, Add Item / SKU modal, quick Restock PO) and Movement Ledger (IN / OUT audit trail with references, quantity deltas, balance changes, and timestamps).
Reports: Switchable Stock Report, Sales Report, and Purchase Report views with filtered summary metrics and one-click Export CSV download.
2. Folder Structure & What Every Component Does
Text
frontend/
├── .env.example              # Frontend API base URL template (VITE_API_URL)
├── .gitignore                # Ignores node_modules, dist, and .env files
├── index.html                # HTML shell with Google Fonts (Plus Jakarta Sans, DM Sans, JetBrains Mono)
├── package.json              # Frontend libraries and Vite dev/build/lint scripts
├── tsconfig.json             # Strict TypeScript config for React JSX
├── vercel.json               # SPA rewrite rules for Vercel deployment
├── vite.config.ts            # Vite bundler config + /api dev proxy to http://localhost:5000
├── README.md                 # Frontend documentation, component guide, and Render/Vercel deploy steps
└── src/
    ├── main.tsx              # Mounts the React root into #root
    ├── index.css             # Tailwind CSS v4 import, font tokens, and tabular-nums utility
    ├── vite-env.d.ts         # Vite client TypeScript declarations (import.meta.env and CSS imports)
    ├── App.tsx               # Main application shell: responsive sidebar navigation, top breadcrumb bar, loading/error states, toast notifications, and modal orchestration
    ├── types/
    │   └── inventory.ts      # Shared TypeScript interfaces (StockItem, SalesOrder, PurchaseOrder, StockMovement, form inputs)
    ├── lib/
    │   ├── api.ts            # Typed fetch client calling backend endpoints (/inventory/state, /sales, /purchases, /stock, /reset)
    │   ├── constants.ts      # Predefined Godown location and Product Category options for dropdowns
    │   ├── csv.ts            # RFC-4180 CSV escaping and browser file download helper for Reports
    │   └── formatters.ts     # Currency, number, date/time formatters and Healthy vs Low Stock status calculator
    ├── context/
    │   └── InventoryContext.tsx # Global React Context fetching state from backend API, computing derived KPIs, and exposing async actions to pages/modals
    ├── components/
    │   ├── Modal.tsx              # Reusable accessible dialog modal (backdrop click + Escape key support)
    │   ├── StatusIndicator.tsx    # Semantic icon + text status labels (Healthy, Low Stock, Completed, Pending, Received, IN, OUT)
    │   ├── CreateSaleModal.tsx    # Modal form to create a Sales Order with live available stock check, order total calculation, and oversell prevention
    │   ├── CreatePurchaseModal.tsx # Modal form to create a Purchase Order with suggested reorder quantities and unit cost calculation
    │   └── AddStockItemModal.tsx  # Modal form to register a new SKU with initial stock, min threshold, godown, and unit price
    └── pages/
        ├── DashboardPage.tsx # Renders 4 KPI summary metrics, quick-action buttons, Low Stock Alerts table, and Recent Stock Movements feed
        ├── SalesPage.tsx     # Manages Sales Orders list, search/status filters, inline oversell error alerts, and Pending -> Completed fulfillment
        ├── PurchasePage.tsx  # Manages Purchase Orders list, search/status filters, and Pending -> Received stock replenishment
        ├── StockPage.tsx     # Manages Inventory Items table (godown & health filters) and Movement Ledger tab (IN/OUT audit trail)
        └── ReportsPage.tsx   # Renders switchable Stock, Sales, and Purchase summary reports and triggers CSV export downloads
3. Libraries & Laptop Setup
Prerequisites
Node.js v18+ or v20+
Make sure the backend/ server is running first (http://localhost:5000).
Libraries Installed via npm install
Runtime Dependencies:
react, react-dom — UI component library
lucide-react — Crisp UI icons across navigation, tables, and status indicators
Development / Build Dependencies:
vite, @vitejs/plugin-react — Fast dev server and production bundler
tailwindcss, @tailwindcss/vite — Tailwind CSS v4 styling engine
typescript, @types/react, @types/react-dom — TypeScript type checking
Run Locally on Your Laptop
Open a second terminal inside the frontend folder (keep backend running in the first terminal):
Bash
cd frontend
Install all required libraries:
Bash
npm install
(Optional) Copy .env.example to .env:
Bash
cp .env.example .env
(If you skip .env locally, vite.config.ts automatically proxies /api/* requests to http://localhost:5000.)
Start the frontend dev server:
Bash
npm run dev
Open your browser at http://localhost:5173.
4. How to Deploy Frontend on Render (Static Site)
Make sure your backend/ is already deployed on Render and you have its live URL (e.g. https://stockledger-backend.onrender.com).
In the Render Dashboard, click New + -> Static Site.
Connect your GitHub repository and configure:
Name: stockledger-frontend
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
Add an Environment Variable under Environment:
Key: VITE_API_URL
Value: https://stockledger-backend.onrender.com/api (replace with your real Render backend URL; /api is also appended automatically if omitted. Note: if you add or change VITE_API_URL after first deploy, click Manual Deploy -> Clear build cache & deploy so Vite rebuilds with the new URL.)
Under Redirects/Rewrites, add a rewrite rule so client routes never 404:
Source: /*
Destination: /index.html
Action: Rewrite
Click Create Static Site.
Copy your live frontend URL (e.g. https://stockledger-frontend.onrender.com) and add it to your backend service's CORS_ORIGIN environment variable on Render (or keep CORS_ORIGIN=*).
Alternative: Deploy Frontend on Vercel
Import the repository in Vercel and set Root Directory to frontend.
Set Environment Variable VITE_API_URL=https://your-backend-url.onrender.com/api.
vercel.json is already included—click Deploy.