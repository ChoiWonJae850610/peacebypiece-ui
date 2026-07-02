"use client";

import { useMemo, useState } from "react";

import { WaflSegmentedTabs, WaflMobileDetailContent, type WaflSegmentedTabItem } from "@/components/common/ui";
import WorkOrderDetailSectionStack from "@/components/workorder/detail/shared/WorkOrderDetailSectionStack";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import WorkOrderDetailMobileCostSummarySection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileCostSummarySection";
import WorkOrderDetailMobileActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection";
import WorkOrderDetailMobileHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection";
import WorkOrderDetailMobileOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection";
import WorkOrderDetailMobileProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import WorkOrderSizeSpecPanel from "@/components/workorder/detail/WorkOrderSizeSpecPanel";
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
  const tabs = useMemo<Array<WaflSegmentedTabItem<WorkOrderMobilePanelKey>>>(() => {
    const items: Array<WaflSegmentedTabItem<WorkOrderMobilePanelKey>> = [
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
    <WaflMobileDetailContent>
      <WaflSegmentedTabs
        items={tabs}
        value={resolvedPanel}
        onChange={setActivePanel}
        sticky
        ariaLabel={detailTabs.aria}
        className="mb-4"
      />

      {resolvedPanel === "summary" ? (
        <WorkOrderDetailSectionStack device="mobile">
          <WorkOrderDetailMobileHeaderSection {...viewModel.headerProps} />
          {viewModel.rejectionReasonNoticeProps ? <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /> : null}
          <WorkOrderDetailMobileActionSection {...viewModel.actionProps} />
          <WorkOrderDetailMobileCostSummarySection {...viewModel.costSummaryProps} />
        </WorkOrderDetailSectionStack>
      ) : null}

      {resolvedPanel === "order" ? (
        <WorkOrderDetailSectionStack device="mobile">
          <WorkOrderDetailMobileOrderInfoSection {...viewModel.orderInfoProps} />
          <WorkOrderSizeSpecPanel
            workOrderId={viewModel.workOrderId}
            locked={viewModel.sizeSpecLocked}
          />
        </WorkOrderDetailSectionStack>
      ) : null}

      {resolvedPanel === "production" && viewModel.showProductionComposition ? (
        <WorkOrderDetailSectionStack device="mobile">
          <WorkOrderDetailMobileProductionCompositionSection {...viewModel.productionCompositionProps} />
        </WorkOrderDetailSectionStack>
      ) : null}

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </WaflMobileDetailContent>
  );
}
