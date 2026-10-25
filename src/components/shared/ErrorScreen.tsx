import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

/** Full-screen message shown when the orders can't be loaded. */
export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => (
  <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
    <div className="flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
      <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Orders</h2>
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-sm"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  </div>
);
