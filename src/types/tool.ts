import { z } from 'zod/v3';

export interface Tool<TParams = unknown, TResult = unknown> {
  description: string;
  parameters: z.ZodType<TParams>;
  execute: (
    args: TParams,
    options?: { signal?: AbortSignal }
  ) => Promise<TResult>;
  experimental_toToolResultContent?: (result: TResult) => unknown;
}
