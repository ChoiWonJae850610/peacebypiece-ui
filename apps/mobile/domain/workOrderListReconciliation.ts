import type { WorkOrderDetailCore, WorkOrderListItem } from "./mobileContract";

export function workOrderListWorkflowChanged(
  current: WorkOrderListItem,
  refreshed: WorkOrderDetailCore,
): boolean {
  return current.status !== refreshed.header.status
    || current.latestDocumentStatus !== refreshed.header.document.status;
}

export function reconcileWorkOrderListItemFromDetail(
  current: WorkOrderListItem,
  refreshed: WorkOrderDetailCore,
): WorkOrderListItem {
  if (current.workOrderId !== refreshed.header.id) return current;
  return {
    ...current,
    displayDocumentNumber: refreshed.header.document.displayDocumentNumber,
    productName: refreshed.header.productName,
    status: refreshed.header.status,
    dueDate: refreshed.header.dueDate,
    totalQuantity: refreshed.header.totalQuantity,
    estimatedAmountSummary: {
      currency: refreshed.amounts.currency,
      estimatedTotal: refreshed.amounts.estimatedTotal,
    },
    representativeThumbnail: refreshed.header.representativeImage,
    latestDocumentStatus: refreshed.header.document.status,
    identity: refreshed.header.identity,
    updatedAt: refreshed.header.updatedAt,
  };
}
