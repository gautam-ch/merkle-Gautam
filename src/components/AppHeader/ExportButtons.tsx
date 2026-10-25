import { Download } from 'lucide-react';

interface ExportButtonsProps {
  count: number; // rows the export will contain
  hasSelection: boolean;
  onExport: (format: 'csv' | 'json') => void;
}

const BUTTON_CLASS =
  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer';

export const ExportButtons: React.FC<ExportButtonsProps> = ({ count, hasSelection, onExport }) => {
  const what = hasSelection ? 'selected' : 'filtered';
  const titleFor = (format: string) => `Export ${count.toLocaleString()} ${what} orders as ${format}`;

  return (
    <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
      <button onClick={() => onExport('csv')} title={titleFor('CSV')} className={BUTTON_CLASS}>
        <Download className="h-3 w-3" />
        CSV
      </button>
      <div className="h-3.5 w-px bg-slate-200" />
      <button onClick={() => onExport('json')} title={titleFor('JSON')} className={BUTTON_CLASS}>
        <Download className="h-3 w-3" />
        JSON
      </button>
    </div>
  );
};
