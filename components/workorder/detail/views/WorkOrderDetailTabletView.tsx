"use client";

import { useMemo, useState } from "react";

import { AppSegmentedTabs, type AppSegmentedTabItem } from "@/components/common/ui";
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
  const groups = i18n.workorder.ui.detailGroups;
  const tabs = useMemo<Array<AppSegmentedTabItem<WorkOrderTabletPanelKey>>>(() => {
    const items: Array<AppSegmentedTabItem<WorkOrderTabletPanelKey>> = [
      { key: "summary", label: i18n.workorder.ui.actionSection.title },
      { key: "order", label: groups.order.title },
    ];

    if (viewModel.showProductionComposition) {
      items.push({ key: "production", label: groups.production.title });
    }

    return items;
  }, [groups.order.title, groups.production.title, i18n.workorder.ui.actionSection.title, viewModel.showProductionComposition]);

  const resolvedPanel = activePanel === "production" && !viewModel.showProductionComposition ? "summary" : activePanel;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <AppSegmentedTabs
        items={tabs}
        value={resolvedPanel}
        onChange={setActivePanel}
        sticky
        ariaLabel={i18n.workorder.ui.actionSection.title}
        className="mb-5"
      />

      {resolvedPanel === "summary" ? (
        <TabletSplitLayout>
          <WorkOrderDetailTabletHeaderSection {...viewModel.headerProps} />
          {viewModel.rejectionReasonNoticeProps ? <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /> : null}
          <WorkOrderDetailTabletActionSection {...viewModel.actionProps} />
          {viewModel.showCostSummary ? <WorkOrderDetailTabletCostSummarySection {...viewModel.costSummaryProps} /> : null}
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
    </div>
  );
}
