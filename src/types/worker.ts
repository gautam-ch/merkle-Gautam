import type { NormalizedOrder } from './order';

export type WorkerProgressStage = 'downloading' | 'parsing' | 'normalizing' | 'deduplicating';

export interface WorkerProgressPayload {
  stage: WorkerProgressStage;
  message: string;
  percent?: number;
}

export type WorkerRequest = {
  type: 'FETCH_AND_NORMALIZE';
  payload: {
    url: string;
  };
};

export type WorkerResponse =
  | {
      type: 'PROGRESS';
      payload: WorkerProgressPayload;
    }
  | {
      type: 'SUCCESS';
      payload: {
        orders: NormalizedOrder[];
        totalCount: number;
      };
    }
  | {
      type: 'ERROR';
      payload: {
        message: string;
      };
    };
