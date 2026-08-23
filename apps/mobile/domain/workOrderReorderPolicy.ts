import type { WorkOrderDetailCore } from "./mobileContract";

export function canCreateMobileWorkOrderReorder(detail: WorkOrderDetailCore): boolean {
  return detail.header.identity.isSample === false
    && (detail.header.identity.derivationKind === "original" || detail.header.identity.derivationKind === "reorder")
    && detail.header.status === "issued"
    && detail.revision.status === "finalized";
}
