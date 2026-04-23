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

export function getDatabaseUrl(): string | null {
  const connectionString = process.env.DATABASE_URL;
  return typeof connectionString === "string" && connectionString.trim().length > 0 ? connectionString : null;
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

export type DatabaseRuntimeErrorCode =
  | "DB_NOT_CONFIGURED"
  | "DB_DRIVER_MISSING"
  | "DB_CONNECTION_FAILED"
  | "DB_UNKNOWN_ERROR";

export function getDatabaseRuntimeErrorCode(error: unknown): DatabaseRuntimeErrorCode {
  if (!(error instanceof Error)) return "DB_UNKNOWN_ERROR";

  if (/DATABASE_URL is not configured/i.test(error.message)) {
    return "DB_NOT_CONFIGURED";
  }

  if (/The 'pg' package is required/i.test(error.message) || /Cannot find package 'pg'/i.test(error.message)) {
    return "DB_DRIVER_MISSING";
  }

  return "DB_CONNECTION_FAILED";
}

async function createPool(): Promise<PgPoolLike> {
  const connectionString = getDatabaseUrl();

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
