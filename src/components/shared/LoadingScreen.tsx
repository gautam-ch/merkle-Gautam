import { Loader2 } from 'lucide-react';
import React from 'react';
import type { WorkerProgressPayload } from '../../types/worker';

interface LoadingScreenProps {
  progress: WorkerProgressPayload | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  const message = progress?.message ?? 'Initializing Orders Explorer...';

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="relative flex flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 shadow-2xl backdrop-blur-md max-w-md w-full mx-4 text-center">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-500/20" />
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
          Loading Orders Explorer
        </h2>

        <p className="text-sm text-neutral-400 mb-6 min-h-[2.5rem] flex items-center justify-center">
          {message}
        </p>

        {/* Dynamic progress steps indicator */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-neutral-500 font-mono">
            <span>FETCH</span>
            <span>PARSE</span>
            <span>NORMALIZE</span>
            <span>DEDUP</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full bg-blue-500 transition-all duration-300 ease-out ${
                progress?.stage === 'downloading'
                  ? 'w-1/4'
                  : progress?.stage === 'parsing'
                  ? 'w-2/4'
                  : progress?.stage === 'normalizing'
                  ? 'w-3/4'
                  : progress?.stage === 'deduplicating'
                  ? 'w-11/12'
                  : 'w-1/6'
              }`}
            />
          </div>
        </div>

        <div className="mt-6 text-xs text-neutral-500">
          50,000 records processed entirely in Web Worker background thread
        </div>
      </div>
    </div>
  );
};
