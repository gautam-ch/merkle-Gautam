import type { FieldConfig, FilterCondition } from '../types/filter';

/** A rule as short text for a chip, e.g. "Amount greater than 5000". */
export function describeCondition(condition: FilterCondition, fields: FieldConfig[]): string {
  const field = fields.find((f) => f.id === condition.field);
  const fieldLabel = field?.label ?? String(condition.field);
  const operatorLabel = field?.operators.find((op) => op.value === condition.operator)?.label ?? condition.operator;

  const { value } = condition;
  let valueText: string;
  if (!Array.isArray(value)) {
    valueText = String(value);
  } else if (condition.operator === 'between') {
    valueText = `${value[0] || '…'} - ${value[1] || '…'}`; // an empty side has no limit
  } else {
    valueText = value.join(', ');
  }

  return `${fieldLabel} ${operatorLabel} ${valueText}`;
}
