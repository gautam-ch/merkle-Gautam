import { Loader2 } from 'lucide-react';
import type { WorkerProgressPayload, WorkerStage } from '../../types/worker';

interface LoadingScreenProps {
  progress: WorkerProgressPayload | null;
}

const STEPS: { stage: WorkerStage; label: string }[] = [
  { stage: 'downloading', label: 'DOWNLOAD' },
  { stage: 'parsing', label: 'READ' },
  { stage: 'normalizing', label: 'CLEAN' },
  { stage: 'deduplicating', label: 'DEDUPE' },
];

/** Shown while the orders load, with the current step. */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const step = STEPS.findIndex((s) => s.stage === progress?.stage);
  const percent = Math.max(8, ((step + 1) / STEPS.length) * 100); // never an empty bar

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 text-slate-800">
      <div className="relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xl max-w-md w-full mx-4 text-center">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-500/10" />
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-1">Orders Explorer</h2>

        <p className="text-sm text-slate-500 mb-6 min-h-[2.5rem] flex items-center justify-center">
          {progress?.message ?? 'Starting…'}
        </p>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            {STEPS.map((s) => (
              <span key={s.stage}>{s.label}</span>
            ))}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-400">The file is processed in the background, so the page stays responsive.</div>
      </div>
    </div>
  );
};
