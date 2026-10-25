import { XCircle } from 'lucide-react';

interface EmptyResultsProps {
  onClearFilters: () => void;
}

/** Shown in place of the rows when the filters match nothing. */
export const EmptyResults: React.FC<EmptyResultsProps> = ({ onClearFilters }) => (
  <div className="flex h-96 w-full flex-col items-center justify-center p-8 text-center bg-white">
    <XCircle className="h-12 w-12 text-slate-300 mb-3" />
    <h3 className="text-base font-semibold text-slate-700">No orders match your filters</h3>
    <p className="mt-1.5 text-xs text-slate-400 max-w-sm">Try removing a condition or widening a range.</p>
    <button
      onClick={onClearFilters}
      className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
    >
      Clear All Filters
    </button>
  </div>
);
