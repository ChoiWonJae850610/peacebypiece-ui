import { useEffect, useMemo, useState } from "react";
import type { RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import {
  blurActiveEditableElement,
  type BasicInfoState,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { ensurePartnerMasterItem } from "@/lib/admin/partner/persistence";
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
import { useWorkOrderMaterialsEditor } from "@/lib/hooks/workorder/detailEditor/useWorkOrderMaterialsEditor";
import { usePartnerWorkOrderOptions } from "@/lib/hooks/partners/usePartnerWorkOrderOptions";
import { recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
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
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

  const partnerWorkOrderOptions = usePartnerWorkOrderOptions();

  const {
    materialItems,
    commitMaterialEdit,
    addMaterial,
    removeMaterial,
  } = useWorkOrderMaterialsEditor({
    workOrder,
    editingCell,
    onUpdateWorkOrder,
    cancelEdit: () => {
      blurActiveEditableElement();
      setEditingCell(null);
      setEditingValue("");
    },
  });

  useEffect(() => {
    const nextOrderEntries = getInitialOrderEntries(workOrder);

    setBasicInfo(getInitialBasicInfo(workOrder));
    setBasicInfoDraft(getInitialBasicInfo(workOrder));
    setOrderItems(nextOrderEntries);
  }, [workOrder]);

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
    () => selectOutsourcingVendorOptionsById(outsourcingItems, partnerWorkOrderOptions.outsourcingVendorOptions),
    [outsourcingItems, partnerWorkOrderOptions.outsourcingVendorOptions],
  );

  const syncOrderEntries = (nextItems: OrderEntryState[], extraPatch: Partial<WorkOrder> = {}) => {
    onUpdateWorkOrder({
      ...extraPatch,
      ...toOrderEntriesPatch(nextItems, currentWorkflowState),
    });
  };

  const startEdit = (section: EditableSectionKey, rowId: string, field: string, value: string) => {
    setEditingCell({ section, rowId, field });
    setEditingValue(value);
  };

  const cancelEdit = () => {
    blurActiveEditableElement();
    setEditingCell(null);
    setEditingValue("");
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
        blurActiveEditableElement();
        cancelEdit();
        return;
      }
      const isReworkToMain = isReworkToMainTransition(workOrder.workOrderKind, nextWorkOrderKind);
      syncOrderEntries(nextItems, {
        workOrderKind: nextWorkOrderKind,
        isDefectOrder: isWorkOrderKind(nextWorkOrderKind, "rework"),
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

    blurActiveEditableElement();
    cancelEdit();
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
    const nextItems = orderItems.length > 1 ? orderItems.filter((item) => item.id !== id) : orderItems;
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
      season: `${basicInfoDraft.season} ${basicInfoDraft.year}`.trim(),
    });
    setBasicInfoModalOpen(false);
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
    materialVendorOptionsById,
    outsourcingVendorOptionsById,
    outsourcingProcessOptions,
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
  };
}
