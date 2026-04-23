import { NextResponse } from "next/server";
import {
  getDatabaseConfigSource,
  getDatabaseRuntimeErrorCode,
  getSupportedDatabaseEnvKeys,
  isDatabaseConfigured,
  queryDb,
} from "@/lib/db/client";

type DbColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

const DATABASE_ENV_HELP = `Expected one of: ${getSupportedDatabaseEnvKeys().join(", ")}`;
const WORK_ORDER_TABLE = "work_orders";
const PAYLOAD_COLUMN_CANDIDATES = ["payload", "data", "workorder_payload", "work_order_payload"] as const;

type DbStatusPayload = {
  mode: "db";
  configured: boolean;
  connected: boolean;
  driverReady: boolean;
  fallbackActive: boolean;
  source: "status-check";
  code:
    | "READY"
    | "DB_NOT_CONFIGURED"
    | "DB_DRIVER_MISSING"
    | "DB_CONNECTION_FAILED"
    | "DB_TABLE_MISSING"
    | "DB_SCHEMA_INVALID"
    | "DB_SCHEMA_UNSUPPORTED"
    | "DB_UNKNOWN_ERROR";
  message: string | null;
  configSource?: string | null;
  checkedAt: string;
};

async function inspectWorkOrdersTable() {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [WORK_ORDER_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    return {
      code: "DB_TABLE_MISSING" as const,
      message: `${WORK_ORDER_TABLE} table does not exist in the current schema.`,
    };
  }

  const missingRequired = ["id", "title"].filter((column) => !columnNames.includes(column));
  if (missingRequired.length > 0) {
    return {
      code: "DB_SCHEMA_UNSUPPORTED" as const,
      message: `${WORK_ORDER_TABLE} table is missing required columns: ${missingRequired.join(", ")}`,
    };
  }

  const payloadColumn = PAYLOAD_COLUMN_CANDIDATES.find((column) => columnNames.includes(column));
  if (!payloadColumn) {
    return {
      code: "DB_SCHEMA_UNSUPPORTED" as const,
      message: `${WORK_ORDER_TABLE} table is missing a supported payload column. Expected one of: ${PAYLOAD_COLUMN_CANDIDATES.join(", ")}`,
    };
  }

  const payloadInfo = columns.find((column) => column.column_name === payloadColumn);
  const payloadKind = payloadInfo?.udt_name ?? payloadInfo?.data_type ?? "unknown";
  const payloadSupported = payloadKind === "jsonb" || payloadKind === "json" || payloadKind === "text" || payloadKind === "varchar" || payloadKind === "character varying";

  if (!payloadSupported) {
    return {
      code: "DB_SCHEMA_UNSUPPORTED" as const,
      message: `Unsupported payload column type for ${payloadColumn}: ${payloadInfo?.data_type ?? "unknown"}/${payloadInfo?.udt_name ?? "unknown"}`,
    };
  }

  return { code: "READY" as const, message: null };
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  if (!isDatabaseConfigured()) {
    return NextResponse.json<DbStatusPayload>({
      mode: "db",
      configured: false,
      connected: false,
      driverReady: true,
      fallbackActive: true,
      source: "status-check",
      code: "DB_NOT_CONFIGURED",
      message: `Database connection string is not configured. ${DATABASE_ENV_HELP}`,
      configSource: null,
      checkedAt,
    });
  }

  try {
    await queryDb("SELECT 1 AS ok");
    const tableInspection = await inspectWorkOrdersTable();

    if (tableInspection.code !== "READY") {
      return NextResponse.json<DbStatusPayload>({
        mode: "db",
        configured: true,
        connected: false,
        driverReady: true,
        fallbackActive: true,
        source: "status-check",
        code: tableInspection.code,
        message: tableInspection.message,
        configSource: getDatabaseConfigSource(),
        checkedAt,
      });
    }

    return NextResponse.json<DbStatusPayload>({
      mode: "db",
      configured: true,
      connected: true,
      driverReady: true,
      fallbackActive: false,
      source: "status-check",
      code: "READY",
      message: null,
      configSource: getDatabaseConfigSource(),
      checkedAt,
    });
  } catch (error) {
    const runtimeCode = getDatabaseRuntimeErrorCode(error);
    const message = error instanceof Error ? error.message : "Failed to verify DB connection.";

    return NextResponse.json<DbStatusPayload>({
      mode: "db",
      configured: runtimeCode !== "DB_NOT_CONFIGURED",
      connected: false,
      driverReady: runtimeCode !== "DB_DRIVER_MISSING",
      fallbackActive: true,
      source: "status-check",
      code: runtimeCode,
      message,
      configSource: getDatabaseConfigSource(),
      checkedAt,
    });
  }
}
