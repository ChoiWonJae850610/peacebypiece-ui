import PartnerFactoryRegistryModal from "@/components/workorder/PartnerFactoryRegistryModal";
import BasicInfoEditModal from "@/components/workorder/detail/modals/BasicInfoEditModal";
import OrderInspectionModal from "@/components/workorder/detail/modals/OrderInspectionModal";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { DisplayStage } from "@/types/workflow";
import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";
import type { RoleType, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";

export default function WorkOrderDetail({
  workOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentInventoryQuantity,
  currentUserName,
  currentUserRole,
  canRenameTitle = false,
  canEditInventory,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  isReviewRequestLocked,
  onOpenManagerAssignModal,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
  onUpdateWorkOrder,
  onRenameWorkOrderTitle,
  onCompleteInspection,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentUserRole: RoleType;
  canRenameTitle?: boolean;
  canEditInventory: boolean;
  canChangeManager: boolean;
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  isReviewRequestLocked: boolean;
  onOpenManagerAssignModal: () => void;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  onSetMaterialOpen: (next: boolean) => void;
  onSetOutsourcingOpen: (next: boolean) => void;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
  onRenameWorkOrderTitle: (nextTitle: string) => void;
  onCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
}) {
  const {
    basicInfo,
    orderItems,
    factoryOptions,
    registryModalOpen,
    registryType,
    basicInfoModalOpen,
    basicInfoDraft,
    setBasicInfoDraft,
    materialItems,
    outsourcingItems,
    editingCell,
    editingValue,
    inspectionModalOpen,
    costSummary,
    canOpenInspectionModal,
    productionSectionOpen,
    vendorOptions,
    startEdit,
    cancelEdit,
    commitEdit,
    addOrderEntry,
    removeOrderEntry,
    handleOpenInspectionModal,
    handleCloseInspectionModal,
    handleApplyInspection,
    addMaterial,
    removeMaterial,
    addOutsourcing,
    removeOutsourcing,
    closeRegistryModal,
    handleRegistrySave,
    handleOpenBasicInfoModal,
    handleCloseBasicInfoModal,
    handleSaveBasicInfoModal,
  } = useWorkOrderDetailEditor({
    workOrder,
    currentWorkflowState,
    canEditInventory,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    materialOpen,
    outsourcingOpen,
    onUpdateWorkOrder,
    onCompleteInspection,
  });

  const viewModel = buildWorkOrderDetailViewModel({
    workOrder,
    basicInfo,
    currentInventoryQuantity,
    lastSavedAt,
    currentUserRole,
    canRenameTitle,
    canEditInventory,
    canChangeManager,
    isReviewRequestLocked,
    basicInfoOpen,
    materialOpen,
    outsourcingOpen,
    canSeeProductionSections,
    canSeeCostSections,
    visibleStages,
    currentDisplayStage,
    actions,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    orderItems,
    factoryOptions,
    editingCell,
    editingValue,
    canOpenInspectionModal,
    productionSectionOpen,
    materialItems,
    outsourcingItems,
    vendorOptions,
    costSummary,
    onSave,
    onOpenBasicInfoModal: handleOpenBasicInfoModal,
    onOpenManagerAssignModal,
    onOpenInventoryEditor,
    onRenameWorkOrderTitle,
    onAction,
    onToggleBasicInfo,
    onStartEdit: startEdit,
    onCommitEdit: commitEdit,
    onCancelEdit: cancelEdit,
    onAddOrderEntry: addOrderEntry,
    onRemoveOrderEntry: removeOrderEntry,
    onOpenInspectionModal: handleOpenInspectionModal,
    onToggleProductionSection: () => {
      const nextOpen = !productionSectionOpen;
      onSetMaterialOpen(nextOpen);
      onSetOutsourcingOpen(nextOpen);
    },
    onToggleMaterial,
    onToggleOutsourcing,
    onAddMaterial: addMaterial,
    onRemoveMaterial: removeMaterial,
    onAddOutsourcing: addOutsourcing,
    onRemoveOutsourcing: removeOutsourcing,
  });

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
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
        open={inspectionModalOpen}
        orderEntries={orderItems}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={handleCloseInspectionModal}
        onApply={handleApplyInspection}
      />

      <BasicInfoEditModal
        open={basicInfoModalOpen}
        value={basicInfoDraft}
        onChange={setBasicInfoDraft}
        onClose={handleCloseBasicInfoModal}
        onSave={handleSaveBasicInfoModal}
      />

      <PartnerFactoryRegistryModal
        open={registryModalOpen}
        initialType={registryType}
        onClose={closeRegistryModal}
        onSave={handleRegistrySave}
      />
    </div>
  );
}
