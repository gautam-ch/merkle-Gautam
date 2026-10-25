import { X } from 'lucide-react';
import type { FieldConfig, FilterCondition, FilterOperator } from '../../types/filter';
import type { NormalizedOrder } from '../../types/order';
import { ConditionValueInput } from './ConditionValueInput';

interface FilterRuleProps {
  condition: FilterCondition;
  fields: FieldConfig[];
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

const SELECT_CLASS =
  'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 truncate';

/** One rule: a field, an operator and a value. */
export const FilterRule: React.FC<FilterRuleProps> = ({ condition, fields, onChange, onRemove }) => {
  const field = fields.find((f) => f.id === condition.field);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>Rule</span>
        <button
          onClick={onRemove}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition"
          title="Remove condition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={condition.field}
          onChange={(e) => onChange({ field: e.target.value as keyof NormalizedOrder })}
          className={SELECT_CLASS}
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          value={condition.operator}
          onChange={(e) => onChange({ operator: e.target.value as FilterOperator })}
          className={SELECT_CLASS}
        >
          {field?.operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {field && (
        <ConditionValueInput
          field={field}
          operator={condition.operator}
          value={condition.value}
          onChange={(value) => onChange({ value })}
        />
      )}
    </div>
  );
};
