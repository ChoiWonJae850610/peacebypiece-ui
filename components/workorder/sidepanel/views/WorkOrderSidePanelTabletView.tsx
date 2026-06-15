import WorkOrderSidePanelSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView(props: WorkOrderSidePanelProps) {
  return <WorkOrderSidePanelSections {...props} variant="tablet" />;
}
