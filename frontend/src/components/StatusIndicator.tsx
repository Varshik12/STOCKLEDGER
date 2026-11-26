import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import {
  MovementType,
  PurchaseOrderStatus,
  SalesOrderStatus,
  StockHealthStatus,
} from '../types/inventory';

type StatusVariant =
  | StockHealthStatus
  | SalesOrderStatus
  | PurchaseOrderStatus
  | MovementType;

export function StatusIndicator({ status }: { status: StatusVariant }) {
  switch (status) {
    case 'Healthy':
    case 'Completed':
    case 'Received':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </span>
      );
    case 'Low Stock':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>Low Stock</span>
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>Pending</span>
        </span>
      );
    case 'IN':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-emerald-700 whitespace-nowrap">
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>IN</span>
        </span>
      );
    case 'OUT':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-rose-700 whitespace-nowrap">
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>OUT</span>
        </span>
      );
  }
}
