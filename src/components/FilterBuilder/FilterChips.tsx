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
  // Collect all conditions with group info
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
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 bg-neutral-900/40 px-6 py-2 backdrop-blur-sm">
      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1">
        Active Filters:
      </span>

      {allConditions.map(({ groupId, condition }) => (
        <span
          key={condition.id}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300 transition-colors hover:border-blue-500/50"
        >
          <span className="truncate max-w-xs">{formatChipLabel(condition)}</span>
          <button
            onClick={() => onRemoveCondition(groupId, condition.id)}
            title="Remove this filter"
            className="rounded p-0.5 text-blue-400 hover:bg-blue-500/20 hover:text-white transition"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
      >
        <FilterX className="h-3 w-3" />
        Clear All
      </button>
    </div>
  );
};
