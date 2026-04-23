import PartnerFactoryRegistryModal from "@/components/workorder/PartnerFactoryRegistryModal";
import BasicInfoEditModal from "@/components/workorder/detail/modals/BasicInfoEditModal";
import OrderInspectionModal from "@/components/workorder/detail/modals/OrderInspectionModal";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { ReturnTypeUseWorkOrderDetailEditor } from "@/components/workorder/detail/views/detailViewTypes";
import type { ReturnTypeBuildWorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailDesktopView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
  editor: ReturnTypeUseWorkOrderDetailEditor;
  currentInventoryQuantity: number;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <WorkOrderHeaderSection {...viewModel.headerProps} />

      <WorkOrderActionSection {...viewModel.actionProps} />

      {viewModel.showCostSummary ? (
        <div className="mt-6">
          <WorkOrderCostSummarySection {...viewModel.costSummaryProps} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <OrderInfoSection {...viewModel.orderInfoProps} />

        {viewModel.showProductionComposition ? <ProductionCompositionSection {...viewModel.productionCompositionProps} /> : null}
      </div>

      <OrderInspectionModal
        open={editor.inspectionModalOpen}
        orderEntries={editor.orderItems}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={editor.handleCloseInspectionModal}
        onApply={editor.handleApplyInspection}
      />

      <BasicInfoEditModal
        open={editor.basicInfoModalOpen}
        value={editor.basicInfoDraft}
        onChange={editor.setBasicInfoDraft}
        onClose={editor.handleCloseBasicInfoModal}
        onSave={editor.handleSaveBasicInfoModal}
      />

      <PartnerFactoryRegistryModal
        open={editor.registryModalOpen}
        initialType={editor.registryType}
        onClose={editor.closeRegistryModal}
        onSave={editor.handleRegistrySave}
      />
    </div>
  );
}
