import { Clock, CreditCard, MapPin, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { NormalizedOrder } from '../../types/order';
import { statusStyle } from './badgeStyles';

interface RowDetailSheetProps {
  order: NormalizedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CARD = 'rounded-xl border border-slate-200 bg-slate-50/70';

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
        {icon}
        {label}
      </span>
      <span className="font-mono text-slate-800">{value}</span>
    </div>
  );
}

/** Side panel with everything about one order, opened with Enter or a double-click. */
export const RowDetailSheet: React.FC<RowDetailSheetProps> = ({ order, open, onOpenChange }) => {
  if (!order) return null;

  const iconClass = 'h-3.5 w-3.5 text-slate-400';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white border-l border-slate-200 text-slate-800 flex flex-col h-full overflow-hidden p-0 shadow-2xl">
        <SheetHeader className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono text-xl font-bold text-slate-900 tracking-tight">{order.id}</SheetTitle>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusStyle(order.status)}`}>
              {order.status}
            </span>
          </div>
          <SheetDescription className="text-xs text-slate-500 mt-1">
            Order placed via <span className="font-medium text-slate-700">{order.channel}</span> &bull; {order.createdAtFormatted}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          <div className={`${CARD} p-4`}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Customer
            </div>
            <div className="text-base font-semibold text-slate-900">{order.customerName || 'Anonymous Customer'}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{order.customerEmail || 'No email provided'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`${CARD} p-3.5`}>
              <div className="text-xs text-slate-500 font-medium">Order Total</div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{order.amountFormatted}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {order.currency} &bull; {order.itemCount} item(s)
              </div>
            </div>

            <div className={`${CARD} p-3.5`}>
              <div className="text-xs text-slate-500 font-medium">Priority & Payment</div>
              <div className="text-base font-semibold text-slate-900 mt-1">Priority {order.priorityLabel}</div>
              <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {order.paymentMethod}
              </div>
            </div>
          </div>

          <div className={`${CARD} p-4 space-y-2.5`}>
            <InfoRow icon={<MapPin className={iconClass} />} label="Region" value={order.region} />
            <InfoRow icon={<Clock className={iconClass} />} label="Created At" value={order.createdAtFormatted} />
            <InfoRow icon={<Clock className={iconClass} />} label="Updated At" value={order.updatedAtFormatted} />
          </div>

          {/* Notes are text, never HTML, so tags in them show as written */}
          <div className={`${CARD} p-4`}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Staff Notes</div>
            {order.notes ? (
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                {order.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes attached to this order.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
