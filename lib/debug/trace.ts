type TraceStage = "action" | "api" | "service" | "query" | "result";
type TraceStatus = "start" | "success" | "error" | "skip";

type TracePayloadValue = string | number | boolean | null | undefined;
export type TracePayload = Record<string, TracePayloadValue>;

const TRACE_PREFIX = "[wafl trace]";
const REDACTED_KEY_PATTERN = /token|secret|password|authorization|cookie|url|key/i;

export function isWaflTraceEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function sanitizeTracePayload(payload?: TracePayload): TracePayload | undefined {
  if (!payload) return undefined;

  const sanitized: TracePayload = {};
  for (const [key, value] of Object.entries(payload)) {
    sanitized[key] = REDACTED_KEY_PATTERN.test(key) ? "[redacted]" : value;
  }
  return sanitized;
}

function formatTracePayload(payload?: TracePayload): string {
  const sanitized = sanitizeTracePayload(payload);
  if (!sanitized || Object.keys(sanitized).length === 0) return "";

  return " " +
    Object.entries(sanitized)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" ");
}

export function traceWaflFlow(
  stage: TraceStage,
  name: string,
  payload?: TracePayload,
): void {
  if (!isWaflTraceEnabled()) return;
  console.info(`${TRACE_PREFIX} [${stage}] ${name}${formatTracePayload(payload)}`);
}

export function traceWaflResult(
  name: string,
  status: TraceStatus,
  payload?: TracePayload,
): void {
  if (!isWaflTraceEnabled()) return;
  const logger = status === "error" ? console.warn : console.info;
  logger(`${TRACE_PREFIX} [result] ${name} ${status}${formatTracePayload(payload)}`);
}
