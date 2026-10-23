import {
  AlertCircle,
  Check,
  Database,
  Download,
  FilterX,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Share2,
} from 'lucide-react';
import React, { useDeferredValue, useMemo, useState } from 'react';
import { FilterBuilder } from './components/FilterBuilder/FilterBuilder';
import { FilterChips } from './components/FilterBuilder/FilterChips';
import { VirtualGrid } from './components/Grid/VirtualGrid';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { useOrders } from './hooks/useOrders';
import { useUrlState } from './hooks/useUrlState';
import type { FilterState } from './types/filter';
import type { NormalizedOrder } from './types/order';
import { exportOrders } from './utils/export';
import { applyFilter } from './utils/filter';
import { sortOrders } from './utils/sort';

export const App: React.FC = () => {
  const { orders, loading, error, progress, reload } = useOrders('/orders.json');
  const { urlState, syncToUrl } = useUrlState();

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const deferredFilterState = useDeferredValue(urlState.filter);
  const deferredColumnFilters = useDeferredValue(columnFilters);

  const handleFilterChange = (newFilter: FilterState) => {
    syncToUrl({ filter: newFilter });
  };

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[columnId];
        return next;
      }
      return { ...prev, [columnId]: value };
    });
  };

  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    const updated: FilterState = {
      groups: urlState.filter.groups
        .map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            conditions: g.conditions.filter((c) => c.id !== conditionId),
          };
        })
        .filter((g) => g.conditions.length > 0 || urlState.filter.groups.length === 1),
    };
    syncToUrl({ filter: updated });
  };

  const handleResetAllFilters = () => {
    setColumnFilters({});
    syncToUrl({ filter: { groups: [] } });
  };

  const processedOrders = useMemo(() => {
    let result = orders;

    // Apply Compound Query Builder Filters
    if (deferredFilterState.groups.length > 0) {
      result = applyFilter(result, deferredFilterState);
    }

    // Apply In-Header Quick Filters
    const filterKeys = Object.keys(deferredColumnFilters);
    if (filterKeys.length > 0) {
      result = result.filter((order) => {
        return filterKeys.every((key) => {
          const filterVal = deferredColumnFilters[key].trim().toLowerCase();
          if (!filterVal) return true;

          if (key === 'priority') {
            return order.priorityLabel.toLowerCase() === filterVal;
          }
          if (key === 'status' || key === 'channel' || key === 'region' || key === 'paymentMethod') {
            const val = String((order as unknown as Record<string, unknown>)[key] ?? '').toLowerCase();
            return val === filterVal;
          }

          const orderVal = String((order as unknown as Record<string, unknown>)[key] ?? '').toLowerCase();
          return orderVal.includes(filterVal);
        });
      });
    }

    // Apply Sorting
    if (urlState.sort.field && urlState.sort.direction) {
      result = sortOrders(result, urlState.sort);
    }

    return result;
  }, [orders, deferredFilterState, deferredColumnFilters, urlState.sort]);

  const handleSortChange = (newSort: typeof urlState.sort) => {
    syncToUrl({ sort: newSort });
  };

  const handlePinnedChange = (col: keyof NormalizedOrder | null) => {
    syncToUrl({ pinnedColumn: col });
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    syncToUrl({ selectedIds: newSelection });
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const res = exportOrders(processedOrders, format, 200);
    const notice = res.truncated
      ? `Exported top 200 rows of ${processedOrders.length.toLocaleString()} matching records as ${format.toUpperCase()}`
      : `Exported ${res.count} rows as ${format.toUpperCase()}`;
    setExportNotice(notice);
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (loading) {
    return <LoadingScreen progress={progress} />;
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Orders</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={reload}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeBuilderConditions = urlState.filter.groups.reduce(
    (sum, g) => sum + g.conditions.length,
    0
  );
  const totalActiveFilters = activeBuilderConditions + Object.keys(columnFilters).length;

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-slate-800 overflow-hidden font-sans select-none">
      {/* Top Application Bar matching Wireframe */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            title={isSidebarOpen ? 'Collapse filters sidebar (more table space)' : 'Expand filters sidebar'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Orders Explorer</h1>
            <p className="text-xs text-slate-500">
              Showing <span className="text-slate-900 font-semibold">{processedOrders.length.toLocaleString()}</span> of{' '}
              <span className="text-slate-700">{orders.length.toLocaleString()}</span> orders
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {urlState.selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {urlState.selectedIds.size} selected
              </span>
              <button
                onClick={() => handleSelectionChange(new Set())}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear
              </button>
            </div>
          )}

          {totalActiveFilters > 0 && (
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => handleExport('csv')}
              title="Export top 200 rows as CSV"
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
            <div className="h-3.5 w-[1px] bg-slate-200" />
            <button
              onClick={() => handleExport('json')}
              title="Export top 200 rows as JSON"
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Download className="h-3 w-3" />
              JSON
            </button>
          </div>

          {/* Share URL Button */}
          <button
            onClick={handleShareLink}
            title="Copy shareable URL with filter & sort state"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Link Copied' : 'Share'}
          </button>
        </div>
      </header>

      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="flex items-center justify-between bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs font-medium text-blue-800">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-blue-600 hover:text-blue-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace matching Wireframe */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Filters */}
        {isSidebarOpen && (
          <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-100/90 p-4 flex flex-col gap-3 overflow-hidden">
            <FilterBuilder filterState={urlState.filter} onChange={handleFilterChange} />
          </aside>
        )}

        {/* Right Pane: DATA GRID matching wireframe title and table */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Active Filter Chips Bar */}
          <FilterChips
            filterState={urlState.filter}
            onRemoveCondition={handleRemoveCondition}
            onClearAll={handleResetAllFilters}
          />

          <VirtualGrid
            orders={processedOrders}
            sort={urlState.sort}
            onSortChange={handleSortChange}
            pinnedColumn={urlState.pinnedColumn}
            onPinnedChange={handlePinnedChange}
            selectedIds={urlState.selectedIds}
            onSelectionChange={handleSelectionChange}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            onResetFilters={handleResetAllFilters}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
