"use client";

import { useMemo, useState } from "react";

import { AppResponsiveSurface, AppSegmentedTabs, type AppSegmentedTabItem } from "@/components/common/ui";
import MobileSectionStack from "@/components/workorder/detail/layout/MobileSectionStack";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import WorkOrderDetailMobileCostSummarySection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileCostSummarySection";
import WorkOrderDetailMobileActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection";
import WorkOrderDetailMobileHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection";
import WorkOrderDetailMobileOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection";
import WorkOrderDetailMobileProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";
import { useI18n } from "@/lib/i18n";

type WorkOrderMobilePanelKey = "summary" | "order" | "production";

export default function WorkOrderDetailMobileView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: WorkOrderDetailViewProps) {
  const { i18n } = useI18n();
  const [activePanel, setActivePanel] = useState<WorkOrderMobilePanelKey>("summary");
  const detailTabs = i18n.workorder.ui.layout.mobileDrawer.detailTabs;
  const tabs = useMemo<Array<AppSegmentedTabItem<WorkOrderMobilePanelKey>>>(() => {
    const items: Array<AppSegmentedTabItem<WorkOrderMobilePanelKey>> = [
      { key: "summary", label: detailTabs.basic },
      { key: "order", label: detailTabs.order },
    ];

    if (viewModel.showProductionComposition) {
      items.push({ key: "production", label: detailTabs.production });
    }

    return items;
  }, [detailTabs.basic, detailTabs.order, detailTabs.production, viewModel.showProductionComposition]);

  const resolvedPanel = activePanel === "production" && !viewModel.showProductionComposition ? "summary" : activePanel;

  return (
    <AppResponsiveSurface device="mobile">
      <AppSegmentedTabs
        items={tabs}
        value={resolvedPanel}
        onChange={setActivePanel}
        sticky
        ariaLabel={detailTabs.aria}
        className="mb-4"
      />

      {resolvedPanel === "summary" ? (
        <MobileSectionStack>
          <WorkOrderDetailMobileHeaderSection {...viewModel.headerProps} />
          {viewModel.rejectionReasonNoticeProps ? <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /> : null}
          <WorkOrderDetailMobileActionSection {...viewModel.actionProps} />
          {viewModel.showCostSummary ? <WorkOrderDetailMobileCostSummarySection {...viewModel.costSummaryProps} /> : null}
        </MobileSectionStack>
      ) : null}

      {resolvedPanel === "order" ? (
        <MobileSectionStack>
          <WorkOrderDetailMobileOrderInfoSection {...viewModel.orderInfoProps} />
        </MobileSectionStack>
      ) : null}

      {resolvedPanel === "production" && viewModel.showProductionComposition ? (
        <MobileSectionStack>
          <WorkOrderDetailMobileProductionCompositionSection {...viewModel.productionCompositionProps} />
        </MobileSectionStack>
      ) : null}

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </AppResponsiveSurface>
  );
}
