import WorkOrderDetailContainer from "@/components/workorder/detail/WorkOrderDetailContainer";
import type { WorkOrderDetailProps } from "@/components/workorder/detail/WorkOrderDetail.types";

export type { WorkOrderDetailProps } from "@/components/workorder/detail/WorkOrderDetail.types";

export default function WorkOrderDetail(props: WorkOrderDetailProps) {
  return <WorkOrderDetailContainer {...props} />;
}
