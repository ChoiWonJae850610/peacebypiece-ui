import "server-only";

export type DbQueryResultRow = Record<string, unknown>;

export type DbQueryResult<TRow extends DbQueryResultRow = DbQueryResultRow> = {
  rows: TRow[];
  rowCount: number;
};

type PoolQueryResult<TRow extends DbQueryResultRow = DbQueryResultRow> = {
  rows: TRow[];
  rowCount?: number | null;
};

type PgPoolLike = {
  query: <TRow extends DbQueryResultRow = DbQueryResultRow>(text: string, params?: unknown[]) => Promise<PoolQueryResult<TRow>>;
  end: () => Promise<void>;
};

type PgPoolConstructor = new (config: { connectionString: string }) => PgPoolLike;

let poolPromise: Promise<PgPoolLike> | null = null;

async function loadPoolConstructor(): Promise<PgPoolConstructor> {
  const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<{ Pool?: PgPoolConstructor }>;
  const pgModule = await dynamicImport("pg");

  if (!pgModule?.Pool) {
    throw new Error("The 'pg' package is required for DB mode but is not available.");
  }

  return pgModule.Pool;
}

async function createPool(): Promise<PgPoolLike> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const Pool = await loadPoolConstructor();
  return new Pool({ connectionString });
}

export async function getDbPool(): Promise<PgPoolLike> {
  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

export async function queryDb<TRow extends DbQueryResultRow = DbQueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<DbQueryResult<TRow>> {
  const pool = await getDbPool();
  const result = await pool.query<TRow>(text, params);

  return {
    rows: result.rows,
    rowCount: result.rowCount ?? result.rows.length,
  };
}
