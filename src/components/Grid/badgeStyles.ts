const FALLBACK = 'bg-slate-100 text-slate-700 border-slate-200';

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  '1': 'bg-red-50 text-red-700 border-red-200',
  '2': 'bg-amber-50 text-amber-700 border-amber-200',
  '3': 'bg-blue-50 text-blue-700 border-blue-200',
  None: 'bg-slate-100 text-slate-400 border-slate-200',
};

export const statusStyle = (status: string) => STATUS_STYLES[status] ?? FALLBACK;
export const priorityStyle = (priorityLabel: string) => PRIORITY_STYLES[priorityLabel] ?? FALLBACK;
