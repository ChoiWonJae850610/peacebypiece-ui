"use client";

import { useMemo, useState } from "react";

import { AppResponsiveSurface, AppSegmentedTabs, type AppSegmentedTabItem } from "@/components/common/ui";
import TabletSplitLayout from "@/components/workorder/detail/layout/TabletSplitLayout";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import WorkOrderDetailTabletCostSummarySection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletCostSummarySection";
import WorkOrderDetailTabletActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection";
import WorkOrderDetailTabletHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection";
import WorkOrderDetailTabletOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection";
import WorkOrderDetailTabletProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";
import { useI18n } from "@/lib/i18n";

type WorkOrderTabletPanelKey = "summary" | "order" | "production";

export default function WorkOrderDetailTabletView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: WorkOrderDetailViewProps) {
  const { i18n } = useI18n();
  const [activePanel, setActivePanel] = useState<WorkOrderTabletPanelKey>("summary");
  const detailTabs = i18n.workorder.ui.layout.mobileDrawer.detailTabs;
  const tabs = useMemo<Array<AppSegmentedTabItem<WorkOrderTabletPanelKey>>>(() => {
    const items: Array<AppSegmentedTabItem<WorkOrderTabletPanelKey>> = [
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
    <AppResponsiveSurface device="tablet">
      <AppSegmentedTabs
        items={tabs}
        value={resolvedPanel}
        onChange={setActivePanel}
        sticky
        ariaLabel={detailTabs.aria}
        className="mb-5"
      />

      {resolvedPanel === "summary" ? (
        <TabletSplitLayout>
          <WorkOrderDetailTabletHeaderSection {...viewModel.headerProps} />
          {viewModel.rejectionReasonNoticeProps ? <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /> : null}
          <WorkOrderDetailTabletActionSection {...viewModel.actionProps} />
          <WorkOrderDetailTabletCostSummarySection {...viewModel.costSummaryProps} />
        </TabletSplitLayout>
      ) : null}

      {resolvedPanel === "order" ? (
        <TabletSplitLayout>
          <WorkOrderDetailTabletOrderInfoSection {...viewModel.orderInfoProps} />
        </TabletSplitLayout>
      ) : null}

      {resolvedPanel === "production" && viewModel.showProductionComposition ? (
        <TabletSplitLayout>
          <WorkOrderDetailTabletProductionCompositionSection {...viewModel.productionCompositionProps} />
        </TabletSplitLayout>
      ) : null}

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </AppResponsiveSurface>
  );
}
