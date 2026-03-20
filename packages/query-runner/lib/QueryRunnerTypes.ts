import { Algebra } from '@traqula/algebra-transformations-1-1';
import type { IBindings } from 'fetch-sparql-endpoint';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PromiseRejection = (reason?: any) => void;
type PromiseResolution<T> = (value: T) => void;

interface QueryBatch<T> {
  query: Algebra.Operation;
  endpoint: string;
  bindings: IBindings[];
  callbacks: Record<string, { resolve: PromiseResolution<T>; reject: PromiseRejection }>;
}

type QueryBuffer<T> = Record<string, QueryBatch<T>>;

interface IBatch {
  batch: string;
}

interface IBatchedRequest extends IBatch {
  type: 'ask' | 'select';
  endpoint: string;
  query: string;
}

interface IBatchedResult extends IBatch {
  type: 'ask' | 'select';
  bindings: IBindings[];
}

export type { IBatchedRequest, IBatchedResult, QueryBatch, QueryBuffer, PromiseResolution, PromiseRejection };
