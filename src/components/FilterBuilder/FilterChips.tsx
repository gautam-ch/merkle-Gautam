import { FilterX, X } from 'lucide-react';
import { Fragment } from 'react';
import type { FieldConfig, FilterState } from '../../types/filter';
import { isConditionEmpty } from '../../utils/filterEdit';
import { describeCondition } from '../../utils/filterLabel';

interface FilterChipsProps {
  filterState: FilterState;
  fieldConfigs: FieldConfig[];
  onRemoveCondition: (groupId: string, conditionId: string) => void;
  onClearAll: () => void;
}

/** The active rules as small removable chips above the grid, with "or" / "and" showing how they combine. */
export const FilterChips: React.FC<FilterChipsProps> = ({ filterState, fieldConfigs, onRemoveCondition, onClearAll }) => {
  // Rules with no value yet match everything, so they get no chip
  const chips = filterState.groups.flatMap((group) =>
    group.conditions.filter((condition) => !isConditionEmpty(condition)).map((condition) => ({ groupId: group.id, condition }))
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-6 py-2">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Active Filters:</span>

      {chips.map(({ groupId, condition }, index) => (
        <Fragment key={condition.id}>
          {index > 0 && (
            <span className="text-[10px] font-semibold uppercase text-slate-400">
              {chips[index - 1].groupId === groupId ? 'or' : 'and'}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300">
            <span className="truncate max-w-xs">{describeCondition(condition, fieldConfigs)}</span>
            <button
              onClick={() => onRemoveCondition(groupId, condition.id)}
              title="Remove this filter"
              className="rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-800 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </Fragment>
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
