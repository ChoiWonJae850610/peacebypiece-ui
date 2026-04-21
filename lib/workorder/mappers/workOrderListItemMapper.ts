import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getOfficialAttachments } from "@/lib/workorder/selectors";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import type { WorkOrder, WorkOrderListItem } from "@/types/workorder";

export function createWorkOrderListItem(workOrder: WorkOrder): WorkOrderListItem {
  const officialAttachments = getOfficialAttachments(workOrder.attachments ?? []);
  const submissionSnapshot = getOrderSubmissionSnapshot(workOrder);

  return {
    id: workOrder.id,
    title: workOrder.title,
    displayTitle: workOrder.displayTitle,
    baseTitle: workOrder.baseTitle,
    reorderRound: workOrder.reorderRound,
    revision: workOrder.revision,
    workOrderKind: workOrder.workOrderKind,
    isDefectOrder: workOrder.isDefectOrder,
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
    vendor: submissionSnapshot.factoryName || workOrder.vendor,
    dueDate: submissionSnapshot.dueDate || workOrder.dueDate,
    inventoryStatus: workOrder.inventoryStatus,
    attachments: officialAttachments,
    filesCount: officialAttachments.length,
  };
}
