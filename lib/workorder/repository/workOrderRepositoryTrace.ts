import "server-only";

import { traceWaflFlow, traceWaflResult } from "@/lib/debug/trace";

export type WorkOrderRepositoryTracePayload = Record<
  string,
  string | number | boolean | null | undefined
>;

export function traceWorkOrderRepositoryQueryStart(
  name: string,
  payload?: WorkOrderRepositoryTracePayload,
): void {
  traceWaflFlow("query", name, payload);
}

export function traceWorkOrderRepositoryQuerySuccess(
  name: string,
  payload?: WorkOrderRepositoryTracePayload,
): void {
  traceWaflResult(name, "success", payload);
}
