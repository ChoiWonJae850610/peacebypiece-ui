"use client";

import { useEffect, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import WorkflowValidationModal from "@/components/common/modal/WorkflowValidationModal";
import ModalShell from "@/components/common/modal/ModalShell";
import { WaflButton } from "@/components/common/ui";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import MaterialOrderLineAddModal from "@/features/material-orders/components/MaterialOrderLineAddModal";
import MaterialOrderDesktopWorkspaceView from "@/features/material-orders/layout/MaterialOrderDesktopWorkspaceView";
import MaterialOrderMobileWorkspaceView from "@/features/material-orders/layout/MaterialOrderMobileWorkspaceView";
import MaterialOrderTabletWorkspaceView from "@/features/material-orders/layout/MaterialOrderTabletWorkspaceView";
import { useMaterialOrderDraftEditor } from "@/features/material-orders/hooks/useMaterialOrderDraftEditor";
import { APP_VERSION } from "@/lib/constants/version";
import { MATERIAL_ORDER_STATUS } from "@/lib/material-orders/types";
import { useWorkspaceSelectionController } from "@/lib/hooks/workspace/useWorkspaceSelectionController";
import { useWorkspaceToolState } from "@/lib/hooks/workspace/useWorkspaceToolState";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

type MaterialOrderMobileToolKey = "workorders" | "schedule";

export default function MaterialOrderDraftEditor({
  companyName,
  canRequestMaterialOrder,
  canPlaceMaterialOrder,
  isAdmin,
}: {
  companyName: string;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
  isAdmin: boolean;
}) {
  const {
    drawerOverlayPresentation,
    useDrawerNavigation,
    showListTrigger,
    useStackedProgress,
    useTabletTwoPanel,
    useThreePanel,
  } = useWorkspaceLayoutMode();
  const [mobileOrderListDrawerOpen, setMobileOrderListDrawerOpen] =
    useState(false);

  const {
    orders,
    selectedOrderId,
    selectedOrder,
    ordersLoading,
    ordersError,
    creatingOrder,
    statusChanging,
    headerSaving,
    materialOrderMutationLocked,
    statusToastOperation,
    workOrderCandidates,
    suppliers,
    suppliersLoading,
    suppliersError,
    workOrdersLoading,
    workOrdersError,
    materialType,
    supplierPartnerId,
    lines,
    dueDate,
    totals,
    selectedDraftSupplierName,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
    materialOrderLineAddModal,
    materialOrderValidationModal,
    materialTypeChangeConfirmationModal,
    setSelectedOrderId,
    changeSupplierPartnerId,
    changeDueDate,
    refreshOrders,
    refreshWorkOrderCandidates,
    refreshSuppliers,
    createOrder,
    cancelOrder,
    changeMaterialType,
    changeSelectedOrderStatus,
    updateLine,
    addWorkOrderMaterialLine,
    removeLine,
  } = useMaterialOrderDraftEditor({ isAdmin });

  const {
    open: mobileToolSheetOpen,
    setOpen: setMobileToolSheetOpen,
    activeTool: mobileActiveTool,
    setActiveTool: setMobileActiveTool,
  } = useWorkspaceToolState<MaterialOrderMobileToolKey>({
    resetKey: selectedOrderId,
    defaultTool: "workorders",
  });
  const handleSelectOrder = useWorkspaceSelectionController({
    selectedId: selectedOrderId,
    onSelect: setSelectedOrderId,
    onSelectionChange: () => setMobileOrderListDrawerOpen(false),
  });

  useEffect(() => {
    if (materialOrderLineAddModal.open) {
      setMobileToolSheetOpen(false);
    }
  }, [materialOrderLineAddModal.open, setMobileToolSheetOpen]);

  useEffect(() => {
    if (!showListTrigger) {
      setMobileOrderListDrawerOpen(false);
    }
  }, [showListTrigger]);

  const handleAddMaterialToOrder = (
    ...args: Parameters<typeof addWorkOrderMaterialLine>
  ) => {
    if (!mobileToolSheetOpen) {
      addWorkOrderMaterialLine(...args);
      return;
    }

    setMobileToolSheetOpen(false);
    window.requestAnimationFrame(() => {
      addWorkOrderMaterialLine(...args);
    });
  };

  const topbar = (
    <AdminTopbar
      companyName={companyName || "WAFL"}
      appVersion={APP_VERSION}
      title="원단·부자재"
      description="작업지시서의 자재 발주 대기 항목을 공급처별 발주서로 묶고, 발주 상태와 잔여 자재를 확인합니다."
      onOpenMenu={
        showListTrigger ? () => setMobileOrderListDrawerOpen(true) : undefined
      }
      menuLabel="발주서"
      menuAriaLabel="발주서 목록 열기"
    />
  );

  const statusToast = (
    <ToastMessage
      message={statusToastOperation?.message ?? null}
      tone={statusToastOperation?.tone}
      eventKey={statusToastOperation?.revision ?? null}
      toastId={statusToastOperation?.id ?? null}
    />
  );

  const validationModal = (
    <>
      <MaterialOrderLineAddModal {...materialOrderLineAddModal} />
      <WorkflowValidationModal {...materialOrderValidationModal} />
      <ModalShell
        open={materialTypeChangeConfirmationModal.open}
        title={materialTypeChangeConfirmationModal.title}
        description={materialTypeChangeConfirmationModal.description}
        onClose={materialTypeChangeConfirmationModal.onClose}
        maxWidthClass="sm:max-w-md"
        footer={
          <>
            <WaflButton
              variant="secondary"
              onClick={materialTypeChangeConfirmationModal.onClose}
            >
              {materialTypeChangeConfirmationModal.cancelLabel}
            </WaflButton>
            <WaflButton
              variant="danger"
              onClick={materialTypeChangeConfirmationModal.onConfirm}
            >
              {materialTypeChangeConfirmationModal.confirmLabel}
            </WaflButton>
          </>
        }
      >
        <p className="text-sm leading-6 pbp-text-muted">
          변경 후에는 새 자재 종류에 맞춰 공급처와 품목을 다시 선택해야 합니다.
        </p>
      </ModalShell>
    </>
  );

  const listPanel = (
    <MaterialOrderListPanel
      orders={orders}
      selectedOrderId={selectedOrderId}
      loading={ordersLoading}
      errorMessage={ordersError}
      creating={creatingOrder}
      onSelectOrder={handleSelectOrder}
      onCreateOrder={createOrder}
      onCancelOrder={cancelOrder}
      onRetry={() => void refreshOrders()}
      selectedDraftMaterialType={materialType}
      selectedDraftSupplierName={selectedDraftSupplierName}
    />
  );

  const detailPanel = (
    <MaterialOrderDetailPanel
      selectedOrder={selectedOrder}
      materialType={materialType}
      supplierPartnerId={supplierPartnerId}
      suppliers={suppliers}
      suppliersLoading={suppliersLoading}
      suppliersError={suppliersError}
      lines={lines}
      totals={totals}
      dueDate={dueDate}
      onChangeDueDate={changeDueDate}
      onChangeMaterialType={changeMaterialType}
      onChangeSupplierPartnerId={changeSupplierPartnerId}
      onRetrySuppliers={() => void refreshSuppliers(materialType)}
      statusChanging={statusChanging}
      headerSaving={headerSaving}
      onChangeLine={updateLine}
      onRemoveLine={removeLine}
      onChangeStatus={(status) => void changeSelectedOrderStatus(status)}
      canRequestMaterialOrder={canRequestMaterialOrder}
      canPlaceMaterialOrder={canPlaceMaterialOrder}
      isAdmin={isAdmin}
      workOrderCandidates={workOrderCandidates}
      mobile={useDrawerNavigation}
      mobileSurface={useDrawerNavigation && !useTabletTwoPanel}
      progressLayout={useStackedProgress ? "vertical" : "horizontal"}
      loading={ordersLoading}
    />
  );

  const allocationPanel = (
    <MaterialOrderAllocationPanel
      candidates={workOrderCandidates}
      lines={lines}
      materialRequestQuantityMap={materialRequestQuantityMap}
      materialRequestCompletionMap={materialRequestCompletionMap}
      selectedMaterialType={materialType}
      hasSelectedOrder={Boolean(selectedOrderId)}
      editable={
        !materialOrderMutationLocked &&
        (selectedOrder?.status === MATERIAL_ORDER_STATUS.draft ||
          selectedOrder?.status === MATERIAL_ORDER_STATUS.rejected)
      }
      loading={workOrdersLoading}
      workspaceLoading={ordersLoading}
      errorMessage={workOrdersError}
      onAddMaterialToOrder={handleAddMaterialToOrder}
      onRetry={() => void refreshWorkOrderCandidates()}
      mobile={useDrawerNavigation}
    />
  );

  if (useTabletTwoPanel) {
    return (
      <MaterialOrderTabletWorkspaceView
        topbar={topbar}
        list={listPanel}
        detail={detailPanel}
        side={allocationPanel}
        validationModal={validationModal}
        workspaceOverlay={statusToast}
        listDrawerOpen={mobileOrderListDrawerOpen}
        onCloseListDrawer={() => setMobileOrderListDrawerOpen(false)}
        scrollResetKey={selectedOrderId}
      />
    );
  }

  if (useDrawerNavigation) {
    return (
      <MaterialOrderMobileWorkspaceView
        topbar={topbar}
        list={listPanel}
        detail={detailPanel}
        allocationPanel={allocationPanel}
        validationModal={validationModal}
        workspaceOverlay={statusToast}
        listDrawerOpen={mobileOrderListDrawerOpen}
        onCloseListDrawer={() => setMobileOrderListDrawerOpen(false)}
        scrollResetKey={selectedOrderId}
        hasSelection={Boolean(selectedOrderId)}
        toolOpen={mobileToolSheetOpen}
        onToolOpenChange={setMobileToolSheetOpen}
        activeTool={mobileActiveTool}
        onActiveToolChange={setMobileActiveTool}
        presentation={drawerOverlayPresentation}
      />
    );
  }

  if (useThreePanel) {
    return (
      <MaterialOrderDesktopWorkspaceView
        topbar={topbar}
        list={listPanel}
        detail={detailPanel}
        side={allocationPanel}
        validationModal={validationModal}
        workspaceOverlay={statusToast}
        scrollResetKey={selectedOrderId}
      />
    );
  }

  return null;
}
