export type DbConnectionStateCode =
  | "READY"
  | "DB_NOT_CONFIGURED"
  | "DB_DRIVER_MISSING"
  | "DB_CONNECTION_FAILED"
  | "DB_TABLE_MISSING"
  | "DB_SCHEMA_INVALID"
  | "DB_SCHEMA_UNSUPPORTED"
  | "DB_RESPONSE_PARSE_FAILED"
  | "DB_EMPTY_RESPONSE"
  | "DB_REQUEST_FAILED"
  | "DB_UNKNOWN_ERROR"
  | "UNKNOWN";

export type DbConnectionStatus = {
  mode: "db";
  configured: boolean;
  connected: boolean;
  driverReady: boolean;
  fallbackActive: boolean;
  source: "unknown" | "status-check" | "workspace-load" | "create" | "save" | "delete";
  code: DbConnectionStateCode;
  message: string | null;
  configSource?: string | null;
  checkedAt: string | null;
};

const DEFAULT_STATUS: DbConnectionStatus = {
  mode: "db",
  configured: false,
  connected: false,
  driverReady: false,
  fallbackActive: false,
  source: "unknown",
  code: "UNKNOWN",
  message: null,
  configSource: null,
  checkedAt: null,
};

let currentStatus: DbConnectionStatus = DEFAULT_STATUS;
const listeners = new Set<(status: DbConnectionStatus) => void>();

function shouldPreferIncoming(next: DbConnectionStatus, prev: DbConnectionStatus) {
  if (next.source === "status-check") {
    return !prev.fallbackActive || prev.source === "status-check";
  }

  if (prev.source === "status-check" && next.connected === prev.connected) {
    return false;
  }

  return true;
}

function mergeWithPreviousStatus(next: DbConnectionStatus, prev: DbConnectionStatus): DbConnectionStatus {
  if (next.source === "status-check" && prev.fallbackActive && prev.source !== "status-check") {
    return {
      ...next,
      fallbackActive: true,
      source: prev.source,
      code: prev.code,
      message: prev.message,
      checkedAt: prev.checkedAt ?? next.checkedAt,
    };
  }

  return next;
}

export function getDbConnectionStatus(): DbConnectionStatus {
  return currentStatus;
}

export function setDbConnectionStatus(status: DbConnectionStatus) {
  if (!shouldPreferIncoming(status, currentStatus)) {
    return currentStatus;
  }

  currentStatus = mergeWithPreviousStatus(status, currentStatus);
  listeners.forEach((listener) => listener(currentStatus));
  return currentStatus;
}

export function subscribeDbConnectionStatus(listener: (status: DbConnectionStatus) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
