import type { FieldConfig, FilterCondition } from '../../types/filter';

type Value = FilterCondition['value'];

interface ConditionValueInputProps {
  field: FieldConfig;
  operator: FilterCondition['operator'];
  value: Value;
  onChange: (value: Value) => void;
}

const INPUT_CLASS =
  'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

// Pick one or more of the field's fixed values
function OptionPills({ options, value, onChange }: { options: string[]; value: Value; onChange: (value: Value) => void }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  const toggle = (option: string) =>
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);

  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`rounded px-2 py-0.5 text-[10px] font-medium border transition ${
            selected.includes(option)
              ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-semibold'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// The two boxes of a "between" rule. An empty box means no limit on that side.
function RangeInputs({ type, value, onChange }: { type: 'number' | 'date'; value: Value; onChange: (value: Value) => void }) {
  const [from, to] = Array.isArray(value) && value.length === 2 ? [String(value[0] ?? ''), String(value[1] ?? '')] : ['', ''];

  return (
    <div className="flex items-center gap-2">
      <input type={type} placeholder="Min" value={from} onChange={(e) => onChange([e.target.value, to])} className={INPUT_CLASS} />
      <span className="text-xs text-slate-400">to</span>
      <input type={type} placeholder="Max" value={to} onChange={(e) => onChange([from, e.target.value])} className={INPUT_CLASS} />
    </div>
  );
}

function SingleInput({ type, value, onChange }: { type: 'text' | 'number' | 'date'; value: Value; onChange: (value: Value) => void }) {
  return (
    <input
      type={type}
      placeholder={type === 'date' ? undefined : 'Value...'}
      value={String(value ?? '')}
      // an empty number box stays empty instead of becoming 0
      onChange={(e) => onChange(type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
      className={INPUT_CLASS}
    />
  );
}

/** The input for a rule's value, chosen by the field type and operator. */
export const ConditionValueInput: React.FC<ConditionValueInputProps> = ({ field, operator, value, onChange }) => {
  if (field.type === 'enum') return <OptionPills options={field.options ?? []} value={value} onChange={onChange} />;
  if (operator === 'between' && field.type !== 'text') return <RangeInputs type={field.type} value={value} onChange={onChange} />;
  return <SingleInput type={field.type} value={value} onChange={onChange} />;
};
