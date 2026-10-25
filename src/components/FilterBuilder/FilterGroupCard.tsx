import { Trash2 } from 'lucide-react';
import { Fragment } from 'react';
import type { FieldConfig, FilterCondition, FilterGroup } from '../../types/filter';
import { FilterRule } from './FilterRule';
import { LogicDivider } from './LogicDivider';

interface FilterGroupCardProps {
  group: FilterGroup;
  number: number; // shown as "Group 1", "Group 2", ...
  fields: FieldConfig[];
  canRemove: boolean;
  onAddRule: () => void;
  onRemoveGroup: () => void;
  onUpdateRule: (conditionId: string, updates: Partial<FilterCondition>) => void;
  onRemoveRule: (conditionId: string) => void;
}

/** A group of rules. A row matches the group when it matches any one of the rules. */
export const FilterGroupCard: React.FC<FilterGroupCardProps> = ({
  group,
  number,
  fields,
  canRemove,
  onAddRule,
  onRemoveGroup,
  onUpdateRule,
  onRemoveRule,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 shadow-xs">
    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase">Group {number}</span>
        <span className="text-[10px] text-slate-400">matches any rule</span>
      </div>

      {canRemove && (
        <button onClick={onRemoveGroup} className="text-slate-400 hover:text-red-500 transition" title="Delete group">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>

    <div className="space-y-2.5">
      {group.conditions.map((condition, index) => (
        <Fragment key={condition.id}>
          {index > 0 && <LogicDivider label="OR" />}
          <FilterRule
            condition={condition}
            fields={fields}
            onChange={(updates) => onUpdateRule(condition.id, updates)}
            onRemove={() => onRemoveRule(condition.id)}
          />
        </Fragment>
      ))}
    </div>

    <button
      onClick={onAddRule}
      className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1 hover:bg-slate-50 rounded transition"
    >
      + Add rule to Group {number}
    </button>
  </div>
);
