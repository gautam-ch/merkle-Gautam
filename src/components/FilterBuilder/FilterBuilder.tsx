import { FolderPlus, Plus, Trash2, X } from 'lucide-react';
import React from 'react';
import type {
  FieldConfig,
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterState,
} from '../../types/filter';
import type { NormalizedOrder } from '../../types/order';
import { FIELD_CONFIGS } from '../../utils/filter';

interface FilterBuilderProps {
  filterState: FilterState;
  onChange: (newState: FilterState) => void;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({ filterState, onChange }) => {
  const handleAddCondition = (groupId?: string) => {
    const targetGroupId = groupId ?? filterState.groups[0]?.id;
    const newCondition: FilterCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      field: 'status',
      operator: 'in',
      value: ['delivered'],
    };

    if (!targetGroupId || filterState.groups.length === 0) {
      const newGroup: FilterGroup = {
        id: `grp_${Date.now()}`,
        combinator: 'AND',
        conditions: [newCondition],
      };
      onChange({ groups: [newGroup] });
    } else {
      onChange({
        groups: filterState.groups.map((g) =>
          g.id === targetGroupId
            ? { ...g, conditions: [...g.conditions, newCondition] }
            : g
        ),
      });
    }
  };

  const handleAddGroup = () => {
    const newGroup: FilterGroup = {
      id: `grp_${Date.now()}`,
      combinator: 'OR',
      conditions: [
        {
          id: `cond_${Date.now()}`,
          field: 'status',
          operator: 'in',
          value: [],
        },
      ],
    };

    onChange({
      groups: [...filterState.groups, newGroup],
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    onChange({
      groups: filterState.groups.filter((g) => g.id !== groupId),
    });
  };

  const handleToggleCombinator = (groupId: string) => {
    onChange({
      groups: filterState.groups.map((g) =>
        g.id === groupId
          ? { ...g, combinator: g.combinator === 'AND' ? 'OR' : 'AND' }
          : g
      ),
    });
  };

  const handleUpdateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    onChange({
      groups: filterState.groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          conditions: g.conditions.map((c) => {
            if (c.id !== conditionId) return c;

            if (updates.field && updates.field !== c.field) {
              const newConfig = FIELD_CONFIGS.find((f) => f.id === updates.field);
              const defaultOp = newConfig?.operators[0]?.value ?? 'contains';
              let defaultValue: unknown = '';
              if (newConfig?.type === 'enum') {
                defaultValue = [];
              } else if (defaultOp === 'between') {
                defaultValue = [0, 1000];
              }

              return {
                ...c,
                field: updates.field,
                operator: defaultOp,
                value: defaultValue as FilterCondition['value'],
              };
            }

            return { ...c, ...updates };
          }),
        };
      }),
    });
  };

  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    onChange({
      groups: filterState.groups
        .map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            conditions: g.conditions.filter((c) => c.id !== conditionId),
          };
        })
        .filter((g) => g.conditions.length > 0 || filterState.groups.length === 1),
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto space-y-4 pr-1 text-slate-800">
      {/* Sidebar Header: Clean title "Filters" + single clean "Add Condition" */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Filters
        </h2>
        <button
          onClick={() => handleAddCondition()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Condition
        </button>
      </div>

      {/* Filter Groups Container */}
      {filterState.groups.length === 0 ||
      (filterState.groups.length === 1 && filterState.groups[0].conditions.length === 0) ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-xs text-slate-500 shadow-xs">
          No active conditions. Click <strong className="text-slate-800">Add Condition</strong> to build custom filter logic.
        </div>
      ) : (
        <div className="space-y-4">
          {filterState.groups.map((group, gIndex) => (
            <div
              key={group.id}
              className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 shadow-xs"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Group {gIndex + 1}
                  </span>
                  {/* Combinator Toggle */}
                  <button
                    onClick={() => handleToggleCombinator(group.id)}
                    className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700 hover:bg-slate-200 transition"
                  >
                    Match: {group.combinator}
                  </button>
                </div>

                {filterState.groups.length > 1 && (
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="text-slate-400 hover:text-red-500 transition"
                    title="Delete group"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Conditions List */}
              <div className="space-y-2.5">
                {group.conditions.map((condition) => {
                  const fieldConfig = FIELD_CONFIGS.find((f) => f.id === condition.field);

                  return (
                    <div
                      key={condition.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2 shadow-2xs"
                    >
                      {/* Rule Card Top Row: Label + Remove Button */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Rule</span>
                        <button
                          onClick={() => handleRemoveCondition(group.id, condition.id)}
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition"
                          title="Remove condition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Grid: 2 columns, perfectly balanced, min-w-0 */}
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={condition.field}
                          onChange={(e) =>
                            handleUpdateCondition(group.id, condition.id, {
                              field: e.target.value as keyof NormalizedOrder,
                            })
                          }
                          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                        >
                          {FIELD_CONFIGS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            handleUpdateCondition(group.id, condition.id, {
                              operator: e.target.value as FilterOperator,
                            })
                          }
                          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                        >
                          {fieldConfig?.operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value Input */}
                      <ConditionValueInput
                        config={fieldConfig}
                        operator={condition.operator}
                        value={condition.value}
                        onChange={(newVal) =>
                          handleUpdateCondition(group.id, condition.id, { value: newVal })
                        }
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add Condition within Group */}
              <button
                onClick={() => handleAddCondition(group.id)}
                className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1 hover:bg-slate-50 rounded transition"
              >
                + Add rule to Group {gIndex + 1}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Group Button */}
      <button
        onClick={handleAddGroup}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        Add Group
      </button>
    </div>
  );
};

// Specialized Value Input by Field Type
interface ValueInputProps {
  config?: FieldConfig;
  operator: FilterOperator;
  value: FilterCondition['value'];
  onChange: (val: FilterCondition['value']) => void;
}

const ConditionValueInput: React.FC<ValueInputProps> = ({
  config,
  operator,
  value,
  onChange,
}) => {
  if (!config) return null;

  // Enum Multi-select Pills
  if (config.type === 'enum' && config.options) {
    const selected: string[] = Array.isArray(value) ? value.map(String) : [];

    const toggleOption = (opt: string) => {
      if (selected.includes(opt)) {
        onChange(selected.filter((item) => item !== opt));
      } else {
        onChange([...selected, opt]);
      }
    };

    return (
      <div className="flex flex-wrap gap-1 pt-1">
        {config.options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium border transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // Between for Numbers
  if (config.type === 'number' && operator === 'between') {
    const range: [number, number] =
      Array.isArray(value) && value.length === 2
        ? [Number(value[0]) || 0, Number(value[1]) || 0]
        : [0, 1000];

    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={range[0]}
          onChange={(e) => onChange([Number(e.target.value) || 0, range[1]])}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="number"
          placeholder="Max"
          value={range[1]}
          onChange={(e) => onChange([range[0], Number(e.target.value) || 0])}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // Between for Dates
  if (config.type === 'date' && operator === 'between') {
    const range: [string, string] =
      Array.isArray(value) && value.length === 2
        ? [String(value[0] ?? ''), String(value[1] ?? '')]
        : ['', ''];

    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={range[0]}
          onChange={(e) => onChange([e.target.value, range[1]])}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={range[1]}
          onChange={(e) => onChange([range[0], e.target.value])}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // Single Date
  if (config.type === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  // Single Number
  if (config.type === 'number') {
    return (
      <input
        type="number"
        placeholder="Value..."
        value={String(value ?? '')}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  // Default Text
  return (
    <input
      type="text"
      placeholder="Value..."
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
};
