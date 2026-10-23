import { FilterX, X } from 'lucide-react';
import React from 'react';
import type { FilterState } from '../../types/filter';
import { FIELD_CONFIGS } from '../../utils/filter';

interface FilterChipsProps {
  filterState: FilterState;
  onRemoveCondition: (groupId: string, conditionId: string) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filterState,
  onRemoveCondition,
  onClearAll,
}) => {
  const allConditions = filterState.groups.flatMap((g) =>
    g.conditions.map((c) => ({
      groupId: g.id,
      condition: c,
    }))
  );

  if (allConditions.length === 0) {
    return null;
  }

  const formatChipLabel = (cond: typeof allConditions[0]['condition']) => {
    const config = FIELD_CONFIGS.find((f) => f.id === cond.field);
    const fieldLabel = config?.label ?? String(cond.field);
    const opLabel = config?.operators.find((o) => o.value === cond.operator)?.label ?? cond.operator;

    let valStr = '';
    if (Array.isArray(cond.value)) {
      if (cond.operator === 'between') {
        valStr = `${cond.value[0]} - ${cond.value[1]}`;
      } else {
        valStr = cond.value.join(', ');
      }
    } else {
      valStr = String(cond.value ?? '');
    }

    return `${fieldLabel} ${opLabel} ${valStr}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-6 py-2">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
        Active Filters:
      </span>

      {allConditions.map(({ groupId, condition }) => (
        <span
          key={condition.id}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300"
        >
          <span className="truncate max-w-xs">{formatChipLabel(condition)}</span>
          <button
            onClick={() => onRemoveCondition(groupId, condition.id)}
            title="Remove this filter"
            className="rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-800 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
      >
        <FilterX className="h-3 w-3" />
        Clear All
      </button>
    </div>
  );
};
