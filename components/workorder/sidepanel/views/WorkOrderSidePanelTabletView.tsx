import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderSidePanelSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView(props: WorkOrderSidePanelProps) {
  return (
    <SidePanelSectionStack>
      <WorkOrderSidePanelSections {...props} variant="tablet" />
    </SidePanelSectionStack>
  );
}
