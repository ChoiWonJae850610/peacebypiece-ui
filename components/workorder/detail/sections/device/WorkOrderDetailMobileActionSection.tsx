import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ActionProps = WorkOrderDetailViewModel["actionProps"];

export default function WorkOrderDetailMobileActionSection(props: ActionProps) {
  return <WorkOrderActionSection {...props} layout="vertical" />;
}
