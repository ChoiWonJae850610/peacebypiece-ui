import { useEffect, useMemo, useState } from "react";
import type { RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import {
  type BasicInfoState,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { ensurePartnerMasterItem } from "@/lib/admin/partner/persistence";
import { WORK_ORDER_KIND } from "@/lib/constants/workorderIdentity";
import { isVendorRegistryType, REGISTRY_TYPE } from "@/lib/constants/workorderDomain";
import { getOrderInspectionStatusForCompletion } from "@/lib/constants/workorderStates";
import {
  commitOrderItemsEdit,
  commitOutsourcingItemsEdit,
  createNewOrderEntry,
  createNewOutsourcingItem,
  toOrderEntriesPatch,
  toOutsourcingPatch,
} from "@/lib/hooks/workorder/detailEditor/itemMutations";
import { commitMaterialItemsEdit } from "@/lib/hooks/workorder/detailEditor/materialMutations";
import { useWorkOrderMaterialsEditor } from "@/lib/hooks/workorder/detailEditor/useWorkOrderMaterialsEditor";
import { useWorkOrderEditingSession } from "@/lib/hooks/workorder/detailEditor/useWorkOrderEditingSession";
import { usePartnerWorkOrderOptions } from "@/lib/hooks/partners/usePartnerWorkOrderOptions";
import { recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { normalizeProductionCompositionForWorkflowSnapshot } from "@/lib/workorder/productionCompositionSnapshot";
import { getRepresentativeOrderEntry } from "@/lib/workorder/orderSubmission";
import { REWORK_TO_MAIN_APPEND_ROUND, getWorkOrderKindFromOrderType, isReworkToMainTransition, isWorkOrderKind } from "@/lib/workorder/reorder/helpers";
import {
  getInitialBasicInfo,
  getInitialOrderEntries,
  sanitizeOrderEntry,
} from "@/lib/workorder/detail/detailSanitizers";
import {
  getCanOpenInspectionModal,
  getCostSummaryValues,
  getProductionSectionOpen,
} from "@/lib/workorder/detail/workOrderDetailHelpers";
import {
  mapRegistryTypeToPartnerTypes,
  selectFactoryOptions,
  selectMaterialVendorOptionsById,
  selectOutsourcingProcessOptions,
  selectOutsourcingVendorOptionsById,
} from "@/lib/workorder/detail/detailSelectors";
import type { Outsourcing, WorkOrder, WorkflowState } from "@/types/workorder";
import type { RoleType } from "@/types/permission";

type UseWorkOrderDetailEditorParams = {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  currentUserRole: RoleType;
  canEditInventory: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
  onCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
};

export function useWorkOrderDetailEditor({
  workOrder,
  currentWorkflowState,
  currentUserRole,
  canEditInventory,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  materialOpen,
  outsourcingOpen,
  onUpdateWorkOrder,
  onCompleteInspection,
}: UseWorkOrderDetailEditorParams) {
  const orderInfoHubPolicy = useMemo(() => deriveOrderInfoHubPolicy({ workOrder, currentWorkflowState, currentUserRole }), [currentUserRole, currentWorkflowState, workOrder]);

  const [basicInfo, setBasicInfo] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [orderItems, setOrderItems] = useState<OrderEntryState[]>(() => getInitialOrderEntries(workOrder));
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>(REGISTRY_TYPE.partner);
  const [basicInfoModalOpen, setBasicInfoModalOpen] = useState(false);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const {
    editingCell,
    editingValue,
    startEdit: startEditingCell,
    cancelEdit,
  } = useWorkOrderEditingSession();
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

  const partnerWorkOrderOptions = usePartnerWorkOrderOptions();

  const {
    materialItems,
    commitMaterialEdit,
    applyMaterialDraftValue,
    addMaterial,
    removeMaterial,
  } = useWorkOrderMaterialsEditor({
    workOrder,
    editingCell,
    onUpdateWorkOrder,
    cancelEdit,
  });

  useEffect(() => {
    const nextBasicInfo = getInitialBasicInfo(workOrder);

    setBasicInfo(nextBasicInfo);
    setBasicInfoDraft(nextBasicInfo);
  }, [
    workOrder.id,
    workOrder.category1,
    workOrder.category2,
    workOrder.category3,
    workOrder.category1Id,
    workOrder.category2Id,
    workOrder.category3Id,
    workOrder.season,
  ]);

  useEffect(() => {
    setOrderItems(getInitialOrderEntries(workOrder));
  }, [workOrder.id, workOrder.orderEntries, workOrder.workflowState]);

  useEffect(() => {
    setOutsourcingItems((workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  }, [workOrder.outsourcing]);

  const costSummary = useMemo(() => getCostSummaryValues({
    orderItems,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
  }), [fabricTotal, orderItems, outsourcingTotal, subsidiaryTotal]);

  const canOpenInspectionModal = useMemo(() => getCanOpenInspectionModal({
    canEditInventory,
    currentWorkflowState,
    orderItems,
  }), [canEditInventory, currentWorkflowState, orderItems]);

  const productionSectionOpen = useMemo(
    () => getProductionSectionOpen(materialOpen, outsourcingOpen),
    [materialOpen, outsourcingOpen],
  );

  const factoryOptions = useMemo(() => selectFactoryOptions(orderItems, partnerWorkOrderOptions.factoryOptions), [orderItems, partnerWorkOrderOptions.factoryOptions]);

  const materialVendorOptionsById = useMemo(
    () => selectMaterialVendorOptionsById(materialItems, partnerWorkOrderOptions.materialVendorOptions),
    [materialItems, partnerWorkOrderOptions.materialVendorOptions],
  );

  const outsourcingProcessOptions = useMemo(
    () => selectOutsourcingProcessOptions(partnerWorkOrderOptions.outsourcingProcessOptions),
    [partnerWorkOrderOptions.outsourcingProcessOptions],
  );

  const outsourcingVendorOptionsById = useMemo(
    () => selectOutsourcingVendorOptionsById(outsourcingItems, partnerWorkOrderOptions.outsourcingVendorOptionsByProcess),
    [outsourcingItems, partnerWorkOrderOptions.outsourcingVendorOptionsByProcess],
  );

  const syncOrderEntries = (nextItems: OrderEntryState[], extraPatch: Partial<WorkOrder> = {}) => {
    onUpdateWorkOrder({
      ...extraPatch,
      ...toOrderEntriesPatch(nextItems, currentWorkflowState),
    });
  };

  const isSameEditingCell = (
    section: "order" | "material" | "outsourcing",
    rowId: string,
    field: string,
  ) => editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;

  const isLiveNumericEditField = (section: "order" | "material" | "outsourcing", field: string) => {
    if (section === "order") {
      return field === "quantity" || field === "laborCost" || field === "lossCost";
    }

    return field === "quantity" || field === "unitCost";
  };

  const startEdit = (
    section: "order" | "material" | "outsourcing",
    rowId: string,
    field: string,
    value: string,
  ) => {
    const shouldApplyLiveDraft = isSameEditingCell(section, rowId, field) && isLiveNumericEditField(section, field);

    startEditingCell(section, rowId, field, value);

    if (!shouldApplyLiveDraft) {
      return;
    }

    const nextEditingCell = { section, rowId, field };

    if (section === "order") {
      const nextItems = commitOrderItemsEdit({
        orderItems,
        editingCell: nextEditingCell,
        nextValue: value,
        currentWorkflowState,
        factoryOptions,
      });
      setOrderItems(nextItems);
      syncOrderEntries(nextItems);
      return;
    }

    if (section === "material") {
      applyMaterialDraftValue(value, nextEditingCell);
      return;
    }

    const nextItems = commitOutsourcingItemsEdit({ outsourcingItems, editingCell: nextEditingCell, nextValue: value });
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder(toOutsourcingPatch(nextItems));
  };

  const commitEdit = (nextValueOverride?: string) => {
    if (!editingCell) {
      return;
    }

    const nextValue = (nextValueOverride ?? editingValue).trim();

    if (editingCell.section === "order") {
      const nextItems = commitOrderItemsEdit({
        orderItems,
        editingCell,
        nextValue,
        currentWorkflowState,
        factoryOptions,
      });
      setOrderItems(nextItems);
      const nextPrimaryType = getRepresentativeOrderEntry(nextItems)?.type ?? getRepresentativeOrderEntry(workOrder.orderEntries)?.type ?? "샘플";
      const nextWorkOrderKind = getWorkOrderKindFromOrderType(nextPrimaryType);
      const requestedOrderType = nextPrimaryType as "메인 생산" | "샘플" | "재작업";
      if (!orderInfoHubPolicy.allowedOrderTypes.includes(requestedOrderType)) {
        setOrderItems(getInitialOrderEntries(workOrder));
        cancelEdit();
        return;
      }
      const isReworkToMain = isReworkToMainTransition(workOrder.workOrderKind, nextWorkOrderKind);
      syncOrderEntries(nextItems, {
        workOrderKind: nextWorkOrderKind,
        isDefectOrder: isWorkOrderKind(nextWorkOrderKind, WORK_ORDER_KIND.rework),
        ...(isReworkToMain ? { reorderRound: REWORK_TO_MAIN_APPEND_ROUND } : {}),
      });
    }

    if (editingCell.section === "material") {
      commitMaterialEdit(nextValue, editingCell);
    }

    if (editingCell.section === "outsourcing") {
      const nextItems = commitOutsourcingItemsEdit({ outsourcingItems, editingCell, nextValue });
      setOutsourcingItems(nextItems);
      onUpdateWorkOrder(toOutsourcingPatch(nextItems));
    }

    cancelEdit();
  };

  const flushPendingDetailEdit = () => {
    if (!editingCell) {
      return false;
    }

    commitEdit();
    return true;
  };

  const addOrderEntry = () => {
    const nextItems = [
      ...orderItems,
      createNewOrderEntry(orderItems, currentWorkflowState),
    ];
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const removeOrderEntry = (id: string) => {
    const nextItems = orderItems.filter((item) => item.id !== id);
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
    if (editingCell?.section === "order" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const handleOpenInspectionModal = () => {
    setInspectionModalOpen(true);
  };

  const handleCloseInspectionModal = () => {
    setInspectionModalOpen(false);
  };

  const handleApplyInspection = ({
    orderEntryId,
    inboundQuantity,
    nextInventoryQuantity,
    memo,
  }: {
    orderEntryId: string;
    inboundQuantity: number;
    nextInventoryQuantity: number;
    memo: string;
  }) => {
    const nextItems = orderItems.map((item) => item.id === orderEntryId
      ? sanitizeOrderEntry({ ...item, inspectionStatus: getOrderInspectionStatusForCompletion() }, item, currentWorkflowState)
      : item);
    setOrderItems(nextItems);
    onCompleteInspection({
      orderEntryId,
      inboundQuantity,
      nextInventoryQuantity,
      memo,
    });
  };

  const addOutsourcing = () => {
    const nextItems = [
      ...outsourcingItems,
      createNewOutsourcingItem(),
    ];
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder(toOutsourcingPatch(nextItems));
  };

  const removeOutsourcing = (id: string) => {
    const nextItems = outsourcingItems.filter((item) => item.id !== id);
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder(toOutsourcingPatch(nextItems));
    if (editingCell?.section === "outsourcing" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const closeRegistryModal = () => {
    setRegistryModalOpen(false);
  };

  const handleRegistrySave = ({ type, name }: { type: RegistryType; name: string }) => {
    const partnerTypes = mapRegistryTypeToPartnerTypes(type);
    if (partnerTypes.length > 0) {
      ensurePartnerMasterItem(name, partnerTypes);
    }

    if (isVendorRegistryType(type)) {
      if (type === REGISTRY_TYPE.partner) {
        setBasicInfo((current) => ({ ...current, partner: name }));
        setBasicInfoDraft((current) => ({ ...current, partner: name }));
      }
      return;
    }

    const nextItems = orderItems.map((item, index) => (index === 0 ? { ...item, factory: name } : item));
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const handleOpenBasicInfoModal = () => {
    setBasicInfoDraft(basicInfo);
    setBasicInfoModalOpen(true);
  };

  const handleCloseBasicInfoModal = () => {
    setBasicInfoDraft(basicInfo);
    setBasicInfoModalOpen(false);
  };

  const handleSaveBasicInfoModal = () => {
    setBasicInfo(basicInfoDraft);
    onUpdateWorkOrder({
      category1: basicInfoDraft.category1,
      category2: basicInfoDraft.category2,
      category3: basicInfoDraft.category3,
      category1Id: basicInfoDraft.category1Id ?? null,
      category2Id: basicInfoDraft.category2Id ?? null,
      category3Id: basicInfoDraft.category3Id ?? null,
    });
    setBasicInfoModalOpen(false);
  };

  const getDraftWorkOrderSnapshot = (): WorkOrder => {
    const normalizedEditingValue = editingValue.trim();
    const snapshotOrderItems = editingCell?.section === "order"
      ? commitOrderItemsEdit({
          orderItems,
          editingCell,
          nextValue: normalizedEditingValue,
          currentWorkflowState,
          factoryOptions,
        })
      : orderItems;
    const snapshotMaterials = editingCell?.section === "material"
      ? commitMaterialItemsEdit({
          materialItems,
          editingCell,
          nextValue: normalizedEditingValue,
        })
      : materialItems;
    const snapshotOutsourcing = editingCell?.section === "outsourcing"
      ? commitOutsourcingItemsEdit({
          outsourcingItems,
          editingCell,
          nextValue: normalizedEditingValue,
        })
      : outsourcingItems;

    const snapshotOrderPatch = toOrderEntriesPatch(snapshotOrderItems, currentWorkflowState);

    return normalizeProductionCompositionForWorkflowSnapshot({
      ...workOrder,
      ...snapshotOrderPatch,
      category1: basicInfo.category1,
      category2: basicInfo.category2,
      category3: basicInfo.category3,
      category1Id: basicInfo.category1Id ?? null,
      category2Id: basicInfo.category2Id ?? null,
      category3Id: basicInfo.category3Id ?? null,
      materials: snapshotMaterials,
      outsourcing: snapshotOutsourcing,
    });
  };

  return {
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
    getDraftWorkOrderSnapshot,
    materialVendorOptionsById,
    outsourcingVendorOptionsById,
    outsourcingProcessOptions,
    startEdit,
    cancelEdit,
    commitEdit,
    flushPendingDetailEdit,
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
  };
}
