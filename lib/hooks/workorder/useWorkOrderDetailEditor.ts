import { useEffect, useMemo, useState } from "react";
import type { RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import {
  blurActiveEditableElement,
  type BasicInfoState,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { ensurePartnerMasterItem, listActivePartnerNamesByTypes } from "@/lib/admin/partnerMasterPersistence";
import { isVendorRegistryType, REGISTRY_TYPE } from "@/lib/constants/workorderDomain";
import {
  FACTORY_OPTIONS,
  PARTNER_OPTIONS,
} from "@/lib/constants/workorderOptions";
import {
  commitOrderItemsEdit,
  commitOutsourcingItemsEdit,
  createNewOrderEntry,
  createNewOutsourcingItem,
  toOrderEntriesPatch,
  toOutsourcingPatch,
} from "@/lib/hooks/workorder/detailEditor/itemMutations";
import { useWorkOrderMaterialsEditor } from "@/lib/hooks/workorder/detailEditor/useWorkOrderMaterialsEditor";
import { recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import {
  appendOption,
  getInitialBasicInfo,
  getInitialOrderEntries,
  sanitizeOrderEntry,
  sanitizeSelectValue,
} from "@/lib/workorder/detail/detailSanitizers";
import {
  getCanOpenInspectionModal,
  getCostSummaryValues,
  getProductionSectionOpen,
  getVendorOptions,
} from "@/lib/workorder/detail/workOrderDetailHelpers";
import type { PartnerType } from "@/types/partner";
import type { Outsourcing, WorkOrder, WorkflowState } from "@/types/workorder";

type UseWorkOrderDetailEditorParams = {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  canEditInventory: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
  onCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
};

function mergeOptionLists(...sources: readonly string[][]): string[] {
  return sources.flat().reduce<string[]>((options, value) => appendOption(options, value), []);
}

function buildSeededPartnerOptions() {
  return mergeOptionLists(
    PARTNER_OPTIONS,
    listActivePartnerNamesByTypes(["material_vendor", "subsidiary_vendor", "outsourcing_vendor"]),
  );
}

function buildSeededFactoryOptions() {
  return mergeOptionLists(FACTORY_OPTIONS, listActivePartnerNamesByTypes(["factory"]));
}

function mapRegistryTypeToPartnerTypes(type: RegistryType): PartnerType[] {
  if (type === REGISTRY_TYPE.factory) return ["factory"];
  if (type === REGISTRY_TYPE.materialVendor) return ["material_vendor"];
  if (type === REGISTRY_TYPE.subsidiaryVendor) return ["subsidiary_vendor"];
  return [];
}

export function useWorkOrderDetailEditor({
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
}: UseWorkOrderDetailEditorParams) {
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [partnerOptions, setPartnerOptions] = useState<string[]>(() => buildSeededPartnerOptions());
  const [orderItems, setOrderItems] = useState<OrderEntryState[]>(() => getInitialOrderEntries(workOrder));
  const [factoryOptions, setFactoryOptions] = useState<string[]>(() => {
    return getInitialOrderEntries(workOrder).reduce<string[]>((options, item) => appendOption(options, item.factory), buildSeededFactoryOptions());
  });
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>(REGISTRY_TYPE.partner);
  const [basicInfoModalOpen, setBasicInfoModalOpen] = useState(false);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

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
    const nextPartnerOptions = buildSeededPartnerOptions();
    const nextOrderEntries = getInitialOrderEntries(workOrder);
    const nextFactoryOptions = nextOrderEntries.reduce<string[]>((options, item) => appendOption(options, item.factory), buildSeededFactoryOptions());

    setPartnerOptions(nextPartnerOptions);
    setFactoryOptions(nextFactoryOptions);
    setBasicInfo((current) => {
      const next = getInitialBasicInfo(workOrder);
      return {
        ...next,
        partner: sanitizeSelectValue(current.partner, nextPartnerOptions, next.partner),
      };
    });
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

  const vendorOptions = useMemo(
    () => getVendorOptions(partnerOptions, materialItems, outsourcingItems),
    [materialItems, outsourcingItems, partnerOptions],
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
      syncOrderEntries(nextItems);
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
      ? sanitizeOrderEntry({ ...item, inspectionStatus: "inspection_completed" }, item, currentWorkflowState)
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
      const nextPartnerOptions = appendOption(buildSeededPartnerOptions(), name);
      setPartnerOptions(nextPartnerOptions);
      if (type === REGISTRY_TYPE.partner) {
        setBasicInfo((current) => ({ ...current, partner: name }));
        setBasicInfoDraft((current) => ({ ...current, partner: name }));
      }
      return;
    }

    const nextFactoryOptions = appendOption(buildSeededFactoryOptions(), name);
    setFactoryOptions(nextFactoryOptions);
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
  };
}
