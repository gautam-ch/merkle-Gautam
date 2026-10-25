import { Search } from 'lucide-react';
import type { DropdownOption } from './columnOptions';

interface ColumnQuickFilterProps {
  value: string;
  options?: DropdownOption[]; // when given, a dropdown is shown instead of a text box
  onChange: (value: string) => void;
}

/** The small filter under a column title: a dropdown for fixed values, a text box otherwise. */
export const ColumnQuickFilter: React.FC<ColumnQuickFilterProps> = ({ value, options, onChange }) => (
  <div className="mt-1.5 flex items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-0.5 shadow-2xs">
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[11px] text-slate-800 text-center focus:outline-none cursor-pointer truncate"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <div className="flex items-center justify-center w-full">
        <Search className="h-2.5 w-2.5 text-slate-400 mr-1 shrink-0" />
        <input
          type="text"
          placeholder="Filter..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[11px] text-slate-800 text-center placeholder-slate-400 focus:outline-none"
        />
      </div>
    )}
  </div>
);
