import WorkOrderSidePanelContainer from "@/components/workorder/sidepanel/WorkOrderSidePanelContainer";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanel(props: WorkOrderSidePanelProps) {
  return <WorkOrderSidePanelContainer {...props} />;
}
