import type { NormalizedOrder } from '../../types/order';
import { extractEnumOptions } from '../../utils/filterFields';

export interface DropdownOption {
  label: string;
  value: string; // '' means "no filter"
}

export type ColumnDropdownOptions = Partial<Record<keyof NormalizedOrder, DropdownOption[]>>;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const PRIORITY_LABELS: Record<string, string> = { '1': '1 (Highest)', '3': '3 (Lowest)' };

/**
 * Options for the dropdown filters under the column headers. The values come
 * from the data, so they always match what is in the grid.
 */
export function getColumnDropdownOptions(orders: NormalizedOrder[]): ColumnDropdownOptions {
  const options = extractEnumOptions(orders);
  const withAll = (allLabel: string, items: DropdownOption[]) => [{ label: allLabel, value: '' }, ...items];
  const plain = (values: string[], toLabel: (value: string) => string) =>
    values.map((value) => ({ label: toLabel(value), value }));

  return {
    status: withAll('All Statuses', plain(options.status, capitalize)),
    channel: withAll('All Channels', plain(options.channel, capitalize)),
    region: withAll('All Regions', plain(options.region, (value) => value.toUpperCase())),
    paymentMethod: withAll(
      'All Payments',
      plain(options.paymentMethod, (value) => (value === 'upi' || value === 'cod' ? value.toUpperCase() : capitalize(value)))
    ),
    priority: withAll('All Priorities', [
      ...plain(options.priorityLabel.filter((value) => value !== 'None'), (value) => PRIORITY_LABELS[value] ?? value),
      { label: 'None', value: 'none' }, // the quick filter matches orders with no priority on "none"
    ]),
  };
}
