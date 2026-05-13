declare module "pg" {
  export type QueryResult<TRow extends Record<string, unknown> = Record<string, unknown>> = {
    rows: TRow[];
    rowCount: number | null;
  };

  export type PoolClient = {
    query: <TRow extends Record<string, unknown> = Record<string, unknown>>(
      text: string,
      params?: unknown[],
    ) => Promise<QueryResult<TRow>>;
    release: () => void;
  };

  export class Pool {
    constructor(config: { connectionString: string });
    query: <TRow extends Record<string, unknown> = Record<string, unknown>>(
      text: string,
      params?: unknown[],
    ) => Promise<QueryResult<TRow>>;
    connect: () => Promise<PoolClient>;
    end: () => Promise<void>;
  }
}
