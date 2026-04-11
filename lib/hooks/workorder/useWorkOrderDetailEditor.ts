import { useEffect, useMemo, useState } from "react";
import type { RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import {
  blurActiveEditableElement,
  type BasicInfoState,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_MATERIAL_TYPE,
  DEFAULT_MATERIAL_UNIT,
  DEFAULT_ORDER_TYPE,
  DEFAULT_OUTSOURCING_PROCESS,
  DEFAULT_OUTSOURCING_UNIT,
  FACTORY_OPTIONS,
  PARTNER_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/lib/constants/workorderOptions";
import { recalculateMaterial, recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import {
  appendOption,
  createId,
  getInitialBasicInfo,
  getInitialOrderEntries,
  sanitizeOrderEntry,
  sanitizeSelectValue,
  toNumber,
} from "@/lib/workorder/detail/detailSanitizers";
import {
  getCanOpenInspectionModal,
  getCostSummaryValues,
  getProductionSectionOpen,
  getVendorOptions,
} from "@/lib/workorder/detail/workOrderDetailHelpers";
import type { Material, Outsourcing, WorkOrder, WorkflowState } from "@/types/workorder";

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
  const [partnerOptions, setPartnerOptions] = useState<string[]>(() => Array.from(new Set(PARTNER_OPTIONS)));
  const [orderItems, setOrderItems] = useState<OrderEntryState[]>(() => getInitialOrderEntries(workOrder));
  const [factoryOptions, setFactoryOptions] = useState<string[]>(() => {
    const seeded = Array.from(new Set(FACTORY_OPTIONS));
    return getInitialOrderEntries(workOrder).reduce<string[]>((options, item) => appendOption(options, item.factory), seeded);
  });
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>("거래처");
  const [basicInfoModalOpen, setBasicInfoModalOpen] = useState(false);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [materialItems, setMaterialItems] = useState<Material[]>(() => (workOrder.materials ?? []).map(recalculateMaterial));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

  useEffect(() => {
    setBasicInfo((current) => {
      const next = getInitialBasicInfo(workOrder);
      return {
        ...next,
        partner: sanitizeSelectValue(current.partner, partnerOptions, next.partner),
      };
    });
    setBasicInfoDraft(getInitialBasicInfo(workOrder));
    const nextOrderEntries = getInitialOrderEntries(workOrder);
    setOrderItems(nextOrderEntries);
    setFactoryOptions((current) => nextOrderEntries.reduce<string[]>((options, item) => appendOption(options, item.factory), current));
  }, [partnerOptions, workOrder]);

  useEffect(() => {
    setMaterialItems((workOrder.materials ?? []).map(recalculateMaterial));
  }, [workOrder.materials]);

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
      orderEntries: nextItems.map((item) => sanitizeOrderEntry(item, undefined, currentWorkflowState)),
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
      const nextItems = orderItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return sanitizeOrderEntry({ ...item, quantity: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "laborCost") {
          return sanitizeOrderEntry({ ...item, laborCost: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "lossCost") {
          return sanitizeOrderEntry({ ...item, lossCost: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "factory") {
          return sanitizeOrderEntry({ ...item, factory: sanitizeSelectValue(nextValue, factoryOptions, DEFAULT_FACTORY_OPTION) }, item, currentWorkflowState);
        }
        if (editingCell.field === "priority") {
          return sanitizeOrderEntry({ ...item, priority: nextValue || PRIORITY_OPTIONS[0] }, item, currentWorkflowState);
        }
        if (editingCell.field === "type") {
          return sanitizeOrderEntry({ ...item, type: nextValue || DEFAULT_ORDER_TYPE }, item, currentWorkflowState);
        }
        if (editingCell.field === "dueDate") {
          return sanitizeOrderEntry({ ...item, dueDate: nextValue }, item, currentWorkflowState);
        }

        return item;
      });
      setOrderItems(nextItems);
      syncOrderEntries(nextItems);
    }

    if (editingCell.section === "material") {
      const nextItems = materialItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return recalculateMaterial({ ...item, quantity: toNumber(nextValue) });
        }
        if (editingCell.field === "unitCost") {
          return recalculateMaterial({ ...item, unitCost: toNumber(nextValue) });
        }
        if (editingCell.field === "type") {
          return { ...item, type: (nextValue || MATERIAL_KIND.fabric) as Material["type"] };
        }

        return { ...item, [editingCell.field]: nextValue } as Material;
      });
      setMaterialItems(nextItems);
      onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
    }

    if (editingCell.section === "outsourcing") {
      const nextItems = outsourcingItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return recalculateOutsourcing({ ...item, quantity: toNumber(nextValue) });
        }
        if (editingCell.field === "unitCost") {
          return recalculateOutsourcing({ ...item, unitCost: toNumber(nextValue) });
        }

        return { ...item, [editingCell.field]: nextValue } as Outsourcing;
      });
      setOutsourcingItems(nextItems);
      onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
    }

    blurActiveEditableElement();
    cancelEdit();
  };

  const addOrderEntry = () => {
    const nextItems = [
      ...orderItems,
      sanitizeOrderEntry({
        id: createId("order"),
        type: DEFAULT_ORDER_TYPE,
        factory: DEFAULT_FACTORY_OPTION,
        dueDate: orderItems[0]?.dueDate || "",
        quantity: 0,
        laborCost: 0,
        lossCost: 0,
      }, undefined, currentWorkflowState),
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

  const addMaterial = () => {
    const nextItems = [
      ...materialItems,
      recalculateMaterial({
        id: createId("material"),
        type: DEFAULT_MATERIAL_TYPE,
        name: "새 자재",
        vendor: "",
        quantity: 0,
        unit: DEFAULT_MATERIAL_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "준비",
      }),
    ];
    setMaterialItems(nextItems);
    onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
  };

  const removeMaterial = (id: string) => {
    const nextItems = materialItems.filter((item) => item.id !== id);
    setMaterialItems(nextItems);
    onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
    if (editingCell?.section === "material" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const addOutsourcing = () => {
    const nextItems = [
      ...outsourcingItems,
      recalculateOutsourcing({
        id: createId("outsourcing"),
        process: DEFAULT_OUTSOURCING_PROCESS,
        vendor: "",
        quantity: 0,
        unitType: DEFAULT_OUTSOURCING_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "대기",
      }),
    ];
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
  };

  const removeOutsourcing = (id: string) => {
    const nextItems = outsourcingItems.filter((item) => item.id !== id);
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
    if (editingCell?.section === "outsourcing" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const closeRegistryModal = () => {
    setRegistryModalOpen(false);
  };

  const handleRegistrySave = ({ type, name }: { type: RegistryType; name: string }) => {
    if (type === "거래처") {
      setPartnerOptions((current) => appendOption(current, name));
      setBasicInfo((current) => ({ ...current, partner: name }));
      setBasicInfoDraft((current) => ({ ...current, partner: name }));
      return;
    }

    setFactoryOptions((current) => appendOption(current, name));
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
