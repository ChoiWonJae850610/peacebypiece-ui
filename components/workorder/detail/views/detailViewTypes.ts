import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";

export type WorkOrderDetailViewModel = ReturnType<typeof buildWorkOrderDetailViewModel>;
export type WorkOrderDetailEditor = ReturnType<typeof useWorkOrderDetailEditor>;

export type WorkOrderDetailViewProps = {
  viewModel: WorkOrderDetailViewModel;
  editor: WorkOrderDetailEditor;
  currentInventoryQuantity: number;
};

export type ReturnTypeBuildWorkOrderDetailViewModel = WorkOrderDetailViewModel;
export type ReturnTypeUseWorkOrderDetailEditor = WorkOrderDetailEditor;
