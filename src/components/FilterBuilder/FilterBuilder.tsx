import { FolderPlus, Plus } from 'lucide-react';
import { Fragment } from 'react';
import type { FieldConfig, FilterState } from '../../types/filter';
import { addCondition, addGroup, removeCondition, removeGroup, updateCondition } from '../../utils/filterEdit';
import { FilterGroupCard } from './FilterGroupCard';
import { LogicDivider } from './LogicDivider';

interface FilterBuilderProps {
  filterState: FilterState;
  onChange: (filter: FilterState) => void;
  fieldConfigs: FieldConfig[];
}

const BUTTON_CLASS =
  'flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition';

/**
 * Builds the filter: rules inside a group match any (OR), and every group
 * must match (AND). All edits go through the pure functions in filterEdit.
 */
export const FilterBuilder: React.FC<FilterBuilderProps> = ({ filterState, onChange, fieldConfigs }) => {
  const { groups } = filterState;
  const isEmpty = groups.every((group) => group.conditions.length === 0);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto space-y-4 pr-1 text-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Filters</h2>
        <button onClick={() => onChange(addCondition(filterState))} className={`${BUTTON_CLASS} px-3 py-1.5`}>
          <Plus className="h-3.5 w-3.5" />
          Add Condition
        </button>
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-xs text-slate-500 shadow-xs">
          No active conditions. Click <strong className="text-slate-800">Add Condition</strong> to build custom filter logic.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <Fragment key={group.id}>
              {index > 0 && <LogicDivider label="AND" />}
              <FilterGroupCard
                group={group}
                number={index + 1}
                fields={fieldConfigs}
                canRemove={groups.length > 1}
                onAddRule={() => onChange(addCondition(filterState, group.id))}
                onRemoveGroup={() => onChange(removeGroup(filterState, group.id))}
                onUpdateRule={(conditionId, updates) =>
                  onChange(updateCondition(filterState, group.id, conditionId, updates, fieldConfigs))
                }
                onRemoveRule={(conditionId) => onChange(removeCondition(filterState, group.id, conditionId))}
              />
            </Fragment>
          ))}
        </div>
      )}

      <button onClick={() => onChange(addGroup(filterState))} className={`${BUTTON_CLASS} w-full p-2.5`}>
        <FolderPlus className="h-3.5 w-3.5" />
        Add Group
      </button>
    </div>
  );
};
