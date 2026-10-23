import {
  AlertCircle,
  Check,
  Database,
  Download,
  FilterX,
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

  // Column quick filters (in-grid header)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // React 19 Concurrent snappiness: deferred values keep input typing at 60 FPS
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

  // Live filter evaluation pipeline
  const processedOrders = useMemo(() => {
    let result = orders;

    // 1. Apply Compound Query Builder Filters (Phase 5 AST)
    if (deferredFilterState.groups.length > 0) {
      result = applyFilter(result, deferredFilterState);
    }

    // 2. Apply In-Header Quick Filters
    const filterKeys = Object.keys(deferredColumnFilters);
    if (filterKeys.length > 0) {
      result = result.filter((order) => {
        return filterKeys.every((key) => {
          const filterVal = deferredColumnFilters[key].toLowerCase();
          const orderVal = String((order as unknown as Record<string, unknown>)[key] ?? '').toLowerCase();
          return orderVal.includes(filterVal);
        });
      });
    }

    // 3. Apply Sorting
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
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-100">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center backdrop-blur-md shadow-2xl">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Orders</h2>
          <p className="text-sm text-neutral-300 mb-6">{error}</p>
          <button
            onClick={reload}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30"
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
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Application Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-6 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Orders Explorer</h1>
            <p className="text-xs text-neutral-400">
              Showing <span className="text-neutral-200 font-semibold">{processedOrders.length.toLocaleString()}</span> of{' '}
              <span className="text-neutral-200">{orders.length.toLocaleString()}</span> orders
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {urlState.selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/30">
                {urlState.selectedIds.size} selected
              </span>
              <button
                onClick={() => handleSelectionChange(new Set())}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Clear
              </button>
            </div>
          )}

          {totalActiveFilters > 0 && (
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          )}

          {/* Export Dropdown / Actions */}
          <div className="flex items-center rounded-md border border-neutral-800 bg-neutral-900 p-0.5">
            <button
              onClick={() => handleExport('csv')}
              title="Export up to 200 rows as CSV"
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
            <div className="h-3.5 w-[1px] bg-neutral-800" />
            <button
              onClick={() => handleExport('json')}
              title="Export up to 200 rows as JSON"
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <Download className="h-3 w-3" />
              JSON
            </button>
          </div>

          {/* Share URL Button */}
          <button
            onClick={handleShareLink}
            title="Copy shareable URL with filter & sort state"
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Link Copied' : 'Share'}
          </button>
        </div>
      </header>

      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="flex items-center justify-between bg-blue-950/90 border-b border-blue-800 px-6 py-2 text-xs text-blue-200">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-blue-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace matching Wireframe */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Filter Grid (Query Builder) */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-3 overflow-hidden">
          <FilterBuilder filterState={urlState.filter} onChange={handleFilterChange} />
        </aside>

        {/* Right Pane: Custom Virtual Data Grid + Filter Chips */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
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
