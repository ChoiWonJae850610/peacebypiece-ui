import PartnerFactoryRegistryModal from "@/components/workorder/PartnerFactoryRegistryModal";
import BasicInfoEditModal from "@/components/workorder/detail/modals/BasicInfoEditModal";
import OrderInspectionModal from "@/components/workorder/detail/modals/OrderInspectionModal";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import { formatBasicSummary } from "@/lib/workorder/detail/detailFormatting";
import type { DisplayStage } from "@/types/workflow";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";
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
  currentUserRole: string;
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

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <WorkOrderHeaderSection
        title={getWorkOrderDisplayTitle(workOrder)}
        summaryText={formatBasicSummary(basicInfo)}
        managerName={workOrder.manager || "-"}
        currentInventoryQuantity={currentInventoryQuantity}
        lastSavedAt={lastSavedAt}
        canChangeManager={canChangeManager}
        currentUserRole={currentUserRole}
        canRenameTitle={canRenameTitle}
        canEditInventory={canEditInventory}
        onSave={onSave}
        onOpenBasicInfoModal={handleOpenBasicInfoModal}
        onOpenManagerAssignModal={onOpenManagerAssignModal}
        onOpenInventoryEditor={onOpenInventoryEditor}
        onRenameTitle={onRenameWorkOrderTitle}
        locked={isReviewRequestLocked}
      />

      <WorkOrderActionSection stages={visibleStages} currentStage={currentDisplayStage} actions={actions} onAction={onAction} />

      {canSeeCostSections ? (
        <div className="mt-6">
          <WorkOrderCostSummarySection
            fabricTotal={fabricTotal}
            subsidiaryTotal={subsidiaryTotal}
            outsourcingTotal={outsourcingTotal}
            laborCost={costSummary.laborCost}
            lossCost={costSummary.lossCost}
            totalCost={costSummary.totalCost}
            unitCost={costSummary.unitCost}
            outsourcing={outsourcingItems}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <OrderInfoSection
          orderEntries={orderItems}
          factoryOptions={factoryOptions}
          open={basicInfoOpen}
          onToggle={onToggleBasicInfo}
          editingCell={editingCell}
          editingValue={editingValue}
          onStartEdit={startEdit}
          onCommitEdit={commitEdit}
          onCancelEdit={cancelEdit}
          onAdd={addOrderEntry}
          onRemove={removeOrderEntry}
          canOpenInspectionModal={canOpenInspectionModal}
          onOpenInspectionModal={handleOpenInspectionModal}
          locked={isReviewRequestLocked}
        />

        {canSeeProductionSections ? (
          <ProductionCompositionSection
            materials={materialItems}
            outsourcing={outsourcingItems}
            open={productionSectionOpen}
            onToggle={() => {
              const nextOpen = !productionSectionOpen;
              onSetMaterialOpen(nextOpen);
              onSetOutsourcingOpen(nextOpen);
            }}
            materialOpen={materialOpen}
            outsourcingOpen={outsourcingOpen}
            onToggleMaterial={onToggleMaterial}
            onToggleOutsourcing={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAddMaterial={addMaterial}
            onRemoveMaterial={removeMaterial}
            onAddOutsourcing={addOutsourcing}
            onRemoveOutsourcing={removeOutsourcing}
            vendorOptions={vendorOptions}
            locked={isReviewRequestLocked}
          />
        ) : null}
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
