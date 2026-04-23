import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderSidePanelSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelMobileView(props: WorkOrderSidePanelProps) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50/60 p-2.5">
      <SidePanelSectionStack compact>
        <WorkOrderSidePanelSections {...props} variant="mobile" memoFirst />
      </SidePanelSectionStack>
    </div>
  );
}
