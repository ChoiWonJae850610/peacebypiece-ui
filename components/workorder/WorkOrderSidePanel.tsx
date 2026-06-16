import WorkOrderSidePanelContainer from "@/components/workorder/sidepanel/WorkOrderSidePanelContainer";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelComponentProps = WorkOrderSidePanelProps & {
  presentation: WorkOrderSidePanelVariant;
};

export default function WorkOrderSidePanel(props: WorkOrderSidePanelComponentProps) {
  return <WorkOrderSidePanelContainer {...props} />;
}
