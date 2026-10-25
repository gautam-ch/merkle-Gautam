import { Database, FilterX, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import { ShareButton } from './ShareButton';

interface AppHeaderProps {
  visibleCount: number;
  totalCount: number;
  selectedCount: number; // everything selected, even rows hidden by a filter
  selectedVisibleCount: number;
  exportCount: number;
  isSidebarOpen: boolean;
  canResetView: boolean;
  onToggleSidebar: () => void;
  onResetView: () => void;
  onClearSelection: () => void;
  onExport: (format: 'csv' | 'json') => void;
}

const ICON_BUTTON_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer';

/** Top bar: title and result count on the left, selection and actions on the right. */
export const AppHeader: React.FC<AppHeaderProps> = ({
  visibleCount,
  totalCount,
  selectedCount,
  selectedVisibleCount,
  exportCount,
  isSidebarOpen,
  canResetView,
  onToggleSidebar,
  onResetView,
  onClearSelection,
  onExport,
}) => (
  <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs z-40">
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleSidebar}
        title={isSidebarOpen ? 'Collapse filters sidebar (more table space)' : 'Expand filters sidebar'}
        className={ICON_BUTTON_CLASS}
      >
        {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
        <Database className="h-4 w-4" />
      </div>
      <div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">Orders Explorer</h1>
        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-900 font-semibold">{visibleCount.toLocaleString()}</span> of{' '}
          <span className="text-slate-700">{totalCount.toLocaleString()}</span> orders
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 mr-2">
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            {selectedVisibleCount === selectedCount
              ? `${selectedCount.toLocaleString()} selected`
              : `${selectedVisibleCount.toLocaleString()} of ${selectedCount.toLocaleString()} selected`}
          </span>
          <button onClick={onClearSelection} className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {canResetView && (
        <button
          onClick={onResetView}
          title="Reset all filters, sorting, and pinned column"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition cursor-pointer"
        >
          <FilterX className="h-3.5 w-3.5" />
          Reset View
        </button>
      )}

      <ExportButtons count={exportCount} hasSelection={selectedCount > 0} onExport={onExport} />
      <ShareButton />
    </div>
  </header>
);
