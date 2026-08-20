import type { WorkOrderDetailCore } from "./mobileContract";

export function workOrderReadinessNeedsCanonicalRefresh(detail: WorkOrderDetailCore) {
  return detail.header.readiness.source !== "server_canonical"
    || detail.header.readiness.basedOnVersion !== detail.header.entityVersion;
}
