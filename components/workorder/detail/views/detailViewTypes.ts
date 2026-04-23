import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";

export type ReturnTypeBuildWorkOrderDetailViewModel = ReturnType<typeof buildWorkOrderDetailViewModel>;
export type ReturnTypeUseWorkOrderDetailEditor = ReturnType<typeof useWorkOrderDetailEditor>;
