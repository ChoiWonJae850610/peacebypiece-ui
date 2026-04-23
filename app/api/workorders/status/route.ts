import { NextResponse } from "next/server";
import { getDatabaseRuntimeErrorCode, isDatabaseConfigured, queryDb } from "@/lib/db/client";

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
    | "DB_UNKNOWN_ERROR";
  message: string | null;
  checkedAt: string;
};

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
      message: "DATABASE_URL is not configured.",
      checkedAt,
    });
  }

  try {
    await queryDb("SELECT 1 AS ok");

    return NextResponse.json<DbStatusPayload>({
      mode: "db",
      configured: true,
      connected: true,
      driverReady: true,
      fallbackActive: false,
      source: "status-check",
      code: "READY",
      message: null,
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
      checkedAt,
    });
  }
}
