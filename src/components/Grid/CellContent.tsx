import type { NormalizedOrder } from '../../types/order';
import { priorityStyle, statusStyle } from './badgeStyles';

interface CellContentProps {
  columnId: keyof NormalizedOrder;
  order: NormalizedOrder;
}

/** What one grid cell shows. Long text is cut short, with the full value in the hover title. */
export const CellContent: React.FC<CellContentProps> = ({ columnId, order }) => {
  switch (columnId) {
    case 'id':
      return <span className="font-mono text-slate-900 font-semibold truncate">{order.id}</span>;
    case 'customerName':
      return (
        <span className="truncate text-slate-800 font-medium" title={order.customerName}>
          {order.customerName || 'Anonymous'}
        </span>
      );
    case 'customerEmail':
      return (
        <span className="truncate font-mono text-[11px] text-slate-600" title={order.customerEmail}>
          {order.customerEmail || '—'}
        </span>
      );
    case 'status':
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
            statusStyle(order.status)
          }`}
        >
          {order.status}
        </span>
      );
    case 'amount':
      return <span className="font-mono font-medium text-slate-900">{order.amountFormatted}</span>;
    case 'createdAt':
      return <span className="font-mono text-slate-600 text-[11px]">{order.createdAtFormatted}</span>;
    case 'updatedAt':
      return <span className="font-mono text-slate-500 text-[11px]">{order.updatedAtFormatted}</span>;
    case 'priority':
      return (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${
            priorityStyle(order.priorityLabel)
          }`}
        >
          {order.priorityLabel}
        </span>
      );
    case 'paymentMethod':
      return (
        <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-slate-700">
          {order.paymentMethod}
        </span>
      );
    case 'itemCount':
      return <span className="font-mono text-slate-800 font-medium">{order.itemCount}</span>;
    case 'region':
      return <span className="font-mono text-slate-700 text-[11px]">{order.region}</span>;
    case 'channel':
      return <span className="text-slate-600 capitalize">{order.channel}</span>;
    case 'notes':
      return (
        <span className="truncate text-slate-600 text-[11px]" title={order.notes}>
          {order.notes || <span className="text-slate-300 italic">—</span>}
        </span>
      );
    default:
      return null;
  }
};
