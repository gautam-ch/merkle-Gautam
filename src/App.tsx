import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader/AppHeader';
import { FilterBuilder } from './components/FilterBuilder/FilterBuilder';
import { FilterChips } from './components/FilterBuilder/FilterChips';
import { VirtualGrid } from './components/Grid/VirtualGrid';
import { Banner } from './components/shared/Banner';
import { ErrorScreen } from './components/shared/ErrorScreen';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { useExport } from './hooks/useExport';
import { useOrders } from './hooks/useOrders';
import { useSelectionCheck } from './hooks/useSelectionCheck';
import { useUrlState } from './hooks/useUrlState';
import { useVisibleOrders } from './hooks/useVisibleOrders';
import { countActiveConditions, removeCondition } from './utils/filterEdit';
import { getFieldConfigs } from './utils/filterFields';

const App: React.FC = () => {
  const { orders, loading, error, progress, reload } = useOrders('/orders.json');
  const { urlState, syncToUrl, urlError, dismissUrlError, fallBackToDefault } = useUrlState();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { filter, columnFilters, sort, pinnedColumn, selectedIds } = urlState;

  const visibleOrders = useVisibleOrders(orders, filter, columnFilters, sort);
  const { selectedVisibleCount, exportCount, notice, dismissNotice, exportAs } = useExport(visibleOrders, selectedIds);
  const fieldConfigs = useMemo(() => getFieldConfigs(orders), [orders]);
  useSelectionCheck(orders, selectedIds, fallBackToDefault);

  const handleColumnFilterChange = (columnId: string, value: string) => {
    const next = { ...columnFilters, [columnId]: value };
    if (!value) delete next[columnId];
    syncToUrl({ columnFilters: next });
  };

  // Clears the filters only; sorting and the pinned column stay
  const clearFilters = () => syncToUrl({ filter: { groups: [] }, columnFilters: {} });

  const resetView = () =>
    syncToUrl({
      filter: { groups: [] },
      columnFilters: {},
      sort: { field: null, direction: null },
      pinnedColumn: null,
    });

  if (loading) return <LoadingScreen progress={progress} />;
  if (error) return <ErrorScreen message={error} onRetry={reload} />;

  const hasFilters = countActiveConditions(filter) + Object.keys(columnFilters).length > 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-slate-800 overflow-hidden font-sans select-none">
      <AppHeader
        visibleCount={visibleOrders.length}
        totalCount={orders.length}
        selectedCount={selectedIds.size}
        selectedVisibleCount={selectedVisibleCount}
        exportCount={exportCount}
        isSidebarOpen={isSidebarOpen}
        canResetView={hasFilters || sort.field !== null || pinnedColumn !== null}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onResetView={resetView}
        onClearSelection={() => syncToUrl({ selectedIds: new Set() })}
        onExport={exportAs}
      />

      {urlError && <Banner tone="warning" message={urlError} onDismiss={dismissUrlError} />}
      {notice && <Banner tone="info" message={notice} onDismiss={dismissNotice} />}

      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-100/90 p-4 flex flex-col gap-3 overflow-hidden">
            <FilterBuilder
              filterState={filter}
              onChange={(next) => syncToUrl({ filter: next })}
              fieldConfigs={fieldConfigs}
            />
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <FilterChips
            filterState={filter}
            onRemoveCondition={(groupId, conditionId) =>
              syncToUrl({ filter: removeCondition(filter, groupId, conditionId) })
            }
            onClearAll={clearFilters}
            fieldConfigs={fieldConfigs}
          />

          <VirtualGrid
            orders={visibleOrders}
            allOrders={orders}
            sort={sort}
            onSortChange={(next) => syncToUrl({ sort: next })}
            pinnedColumn={pinnedColumn}
            onPinnedChange={(column) => syncToUrl({ pinnedColumn: column })}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => syncToUrl({ selectedIds: ids })}
            columnFilters={columnFilters}
            onColumnFilterChange={handleColumnFilterChange}
            onClearFilters={clearFilters}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
