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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'processing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-neutral-950 border-neutral-800 text-neutral-100 flex flex-col h-full overflow-hidden p-0">
        <SheetHeader className="p-6 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-mono text-lg font-bold text-white tracking-tight">
                {order.id}
              </SheetTitle>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-neutral-700 text-neutral-400">
              Schema v{order.schemaVersion}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-neutral-400">
            Order placed via {order.channel} &bull; {order.createdAtFormatted}
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Card */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              <User className="h-3.5 w-3.5 text-blue-400" />
              Customer Information
            </div>
            <div className="text-sm font-medium text-white">{order.customerName || 'Anonymous Customer'}</div>
            <div className="text-xs text-neutral-400 mt-0.5 font-mono">{order.customerEmail || 'No email provided'}</div>
          </div>

          {/* Financials & Order Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5">
              <div className="text-xs text-neutral-400 font-medium">Order Total</div>
              <div className="text-lg font-bold text-white mt-1 font-mono">{order.amountFormatted}</div>
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{order.currency} &bull; {order.itemCount} item(s)</div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5">
              <div className="text-xs text-neutral-400 font-medium">Priority & Payment</div>
              <div className="text-sm font-semibold text-white mt-1">
                {order.priorityLabel} Priority
              </div>
              <div className="text-[10px] text-neutral-500 uppercase font-mono mt-0.5 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {order.paymentMethod}
              </div>
            </div>
          </div>

          {/* Logistics & Timestamps */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                Region
              </span>
              <span className="font-semibold text-white font-mono">{order.region}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                Created At
              </span>
              <span className="text-neutral-200 font-mono">{order.createdAtFormatted}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                Updated At
              </span>
              <span className="text-neutral-200 font-mono">{order.updatedAtFormatted}</span>
            </div>
          </div>

          {/* Notes (Plain Text Escaped - Rule #9) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Staff Notes
            </div>
            {order.notes ? (
              <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                {order.notes}
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic">No notes attached to this order.</p>
            )}
          </div>

          {/* Raw JSON Debug View */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
                Normalized Record
              </span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded bg-neutral-900/60 p-3 font-mono text-[11px] text-neutral-300">
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
