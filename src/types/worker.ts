import type { NormalizedOrder } from './order';

export type WorkerStage = 'downloading' | 'parsing' | 'normalizing' | 'deduplicating';

export interface WorkerProgressPayload {
  stage: WorkerStage;
  message: string;
}

// The page sends the address of the orders file
export interface WorkerRequest {
  url: string;
}

export type WorkerResponse =
  | { type: 'PROGRESS'; payload: WorkerProgressPayload }
  | { type: 'SUCCESS'; payload: { orders: NormalizedOrder[] } }
  | { type: 'ERROR'; payload: { message: string } };
