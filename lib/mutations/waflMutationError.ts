export type WaflMutationError = {
  cause: unknown;
  message: string;
  code?: string;
  status?: number;
};

type ErrorLikeRecord = Record<string, unknown>;

function asErrorRecord(value: unknown): ErrorLikeRecord | null {
  return value !== null && typeof value === "object"
    ? (value as ErrorLikeRecord)
    : null;
}

function readNonEmptyString(record: ErrorLikeRecord | null, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readFiniteNumber(record: ErrorLikeRecord | null, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function normalizeWaflMutationError(
  error: unknown,
  fallbackMessage: string,
): WaflMutationError {
  const record = asErrorRecord(error);
  const nestedError = asErrorRecord(record?.error);
  const message =
    (error instanceof Error && error.message.trim() ? error.message.trim() : undefined) ??
    readNonEmptyString(record, "message") ??
    readNonEmptyString(nestedError, "message") ??
    fallbackMessage;

  return {
    cause: error,
    message,
    code:
      readNonEmptyString(record, "code") ??
      readNonEmptyString(nestedError, "code"),
    status:
      readFiniteNumber(record, "status") ??
      readFiniteNumber(record, "statusCode") ??
      readFiniteNumber(nestedError, "status"),
  };
}
