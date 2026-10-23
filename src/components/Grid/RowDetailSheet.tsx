import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, Clock, Copy, CreditCard, MapPin, User } from 'lucide-react';
import React, { useState } from 'react';
import type { NormalizedOrder } from '../../types/order';

interface RowDetailSheetProps {
  order: NormalizedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RowDetailSheet: React.FC<RowDetailSheetProps> = ({
  order,
  open,
  onOpenChange,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(order, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white border-l border-slate-200 text-slate-800 flex flex-col h-full overflow-hidden p-0 shadow-2xl">
        <SheetHeader className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                {order.id}
              </SheetTitle>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-slate-300 text-slate-600 bg-white">
              Schema v{order.schemaVersion}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-slate-500 mt-1">
            Order placed via <span className="font-medium text-slate-700">{order.channel}</span> &bull; {order.createdAtFormatted}
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          {/* Customer Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Customer Information
            </div>
            <div className="text-base font-semibold text-slate-900">{order.customerName || 'Anonymous Customer'}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{order.customerEmail || 'No email provided'}</div>
          </div>

          {/* Financials & Order Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">Order Total</div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{order.amountFormatted}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.currency} &bull; {order.itemCount} item(s)</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="text-xs text-slate-500 font-medium">Priority & Payment</div>
              <div className="text-base font-semibold text-slate-900 mt-1">
                {order.priorityLabel} Priority
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {order.paymentMethod}
              </div>
            </div>
          </div>

          {/* Logistics & Timestamps */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Region
              </span>
              <span className="font-bold text-slate-900 font-mono">{order.region}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Created At
              </span>
              <span className="text-slate-800 font-mono">{order.createdAtFormatted}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Updated At
              </span>
              <span className="text-slate-800 font-mono">{order.updatedAtFormatted}</span>
            </div>
          </div>

          {/* Notes (Plain Text Escaped - Rule #9) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Staff Notes
            </div>
            {order.notes ? (
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                {order.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes attached to this order.</p>
            )}
          </div>

          {/* Raw JSON Debug View */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Normalized Record
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 rounded bg-white border border-slate-300 px-2.5 py-1 text-[11px] font-mono text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-white border border-slate-200 p-3 font-mono text-[11px] text-slate-800 shadow-inner">
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
