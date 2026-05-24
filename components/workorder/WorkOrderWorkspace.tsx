"use client";

import WorkOrderDeleteConfirmModal from "@/components/common/modal/WorkOrderDeleteConfirmModal";
import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import {
  useWorkOrderWorkspaceController,
  type UseWorkOrderWorkspaceControllerOptions,
} from "@/features/workorders/controllers/useWorkOrderWorkspaceController";

export default function WorkOrderWorkspace(props: UseWorkOrderWorkspaceControllerOptions) {
  const controller = useWorkOrderWorkspaceController(props);

  return (
    <>
      <WorkOrderLayout {...controller.layoutProps} />
      <WorkOrderOverlay {...controller.overlayProps} />
      <WorkOrderDeleteConfirmModal {...controller.workOrderDeleteConfirmProps} />
    </>
  );
}
