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

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const;

type DatabaseUrlEnvKey = (typeof DATABASE_URL_ENV_KEYS)[number];

export function getDatabaseConfigSource(): DatabaseUrlEnvKey | null {
  for (const envKey of DATABASE_URL_ENV_KEYS) {
    const value = process.env[envKey];
    if (typeof value === "string" && value.trim().length > 0) {
      return envKey;
    }
  }

  return null;
}

export function getDatabaseUrl(): string | null {
  const envKey = getDatabaseConfigSource();
  if (!envKey) return null;

  const connectionString = process.env[envKey];
  return typeof connectionString === "string" && connectionString.trim().length > 0 ? connectionString : null;
}

export function getSupportedDatabaseEnvKeys(): readonly DatabaseUrlEnvKey[] {
  return DATABASE_URL_ENV_KEYS;
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

  if (/DATABASE_URL is not configured|No supported database env var is configured/i.test(error.message)) {
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
    throw new Error(`No supported database env var is configured. Expected one of: ${DATABASE_URL_ENV_KEYS.join(", ")}.`);
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
