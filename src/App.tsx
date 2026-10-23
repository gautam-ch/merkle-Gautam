import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import React from 'react';
import { LoadingScreen } from './components/shared/LoadingScreen';
import { useOrders } from './hooks/useOrders';

export const App: React.FC = () => {
  const { orders, loading, error, progress, reload } = useOrders('/orders.json');

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

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Application Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Orders Explorer</h1>
            <p className="text-xs text-neutral-400">
              Normalized Dataset &middot; {orders.length.toLocaleString()} total orders ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Dataset
          </button>
        </div>
      </header>

      {/* Main Workspace matching Wireframe */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Filter Grid placeholder */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/40 p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Filter Grid
          </div>
          <div className="rounded-lg border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
            Filter Builder ready for Phase 5 integration
          </div>
        </aside>

        {/* Right Pane: Data Grid Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="border-b border-neutral-800 px-6 py-2.5 text-xs font-medium text-neutral-400 flex justify-between items-center bg-neutral-900/20">
            <span>DATA GRID</span>
            <span className="text-neutral-500 font-mono">
              Ready for Phase 4 Custom Virtualization ({orders.length.toLocaleString()} records loaded)
            </span>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-2">Worker Pipeline Active</h3>
              <p className="text-xs text-neutral-400 mb-6">
                Successfully parsed, normalized, and deduplicated {orders.length.toLocaleString()} records in Web Worker thread.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">Total Orders</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">{orders.length.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">Schema Versions</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">v1 & v2 Unified</div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">IndexedDB Cache</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">Active</div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="text-neutral-500 text-[10px] uppercase font-semibold">Sample Order ID</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{orders[0]?.id ?? 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
