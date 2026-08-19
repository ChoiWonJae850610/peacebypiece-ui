import type { WorkOrderProcess, WorkOrderProcesses } from "@/domain/mobileContract";

/**
 * Inline callbacks may outlive a background projection refresh. Exact identity
 * is always preferred. The factory role is the only safe semantic fallback
 * because the domain guarantees at most one factory process per WorkOrder.
 */
export function resolveCurrentProductionProcess(current: WorkOrderProcesses, captured: WorkOrderProcess) {
  const exact = current.processes.find((item) => item.id === captured.id);
  if (exact) return exact;
  if (captured.role !== "factory") return null;
  const factories = current.processes.filter((item) => item.role === "factory");
  return factories.length === 1 ? factories[0] : null;
}
