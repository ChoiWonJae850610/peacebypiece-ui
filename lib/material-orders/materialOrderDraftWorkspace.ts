import type { MaterialOrderDraftLine, MaterialOrderDraftType } from "@/lib/material-orders/materialOrderDraftCalculator";

export type MaterialOrderSupplierOption = {
  id: string;
  materialType: MaterialOrderDraftType;
  label: string;
  helperText: string;
};

export type MaterialOrderListItem = {
  id: string;
  code: string;
  materialType: MaterialOrderDraftType;
  supplierName: string;
  statusLabel: string;
  amountLabel: string;
  createdAtLabel: string;
};

export type AllocationCandidateWorkOrder = {
  id: string;
  code: string;
  productName: string;
  reorderLabel: string;
  requestedMaterialLabel: string;
  dueDateLabel: string;
};

export const materialTypeLabels: Record<MaterialOrderDraftType, string> = {
  fabric: "원단",
  submaterial: "부자재",
};

export const materialOrderSupplierOptions: MaterialOrderSupplierOption[] = [
  {
    id: "fabric-supplier-a",
    materialType: "fabric",
    label: "A 원단",
    helperText: "원단 공급처 예시입니다. 실제 거래처 필터는 거래처/품목 분류와 연결합니다.",
  },
  {
    id: "fabric-supplier-b",
    materialType: "fabric",
    label: "B 원단",
    helperText: "원단 공급처 예시입니다.",
  },
  {
    id: "submaterial-supplier-a",
    materialType: "submaterial",
    label: "A 부자재",
    helperText: "부자재 공급처 예시입니다. 실제 거래처 필터는 거래처/품목 분류와 연결합니다.",
  },
];

export const draftMaterialOrderList: MaterialOrderListItem[] = [
  {
    id: "draft-material-order-1",
    code: "MO-0001",
    materialType: "fabric",
    supplierName: "A 원단",
    statusLabel: "작성중",
    amountLabel: "₩0",
    createdAtLabel: "오늘",
  },
  {
    id: "draft-material-order-2",
    code: "MO-0002",
    materialType: "submaterial",
    supplierName: "A 부자재",
    statusLabel: "검토대기",
    amountLabel: "₩0",
    createdAtLabel: "예시",
  },
];

export const allocationCandidateWorkOrders: AllocationCandidateWorkOrder[] = [
  {
    id: "allocation-candidate-1",
    code: "WO-001",
    productName: "셔츠 샘플",
    reorderLabel: "초도",
    requestedMaterialLabel: "원단 미배분",
    dueDateLabel: "납기 미정",
  },
  {
    id: "allocation-candidate-2",
    code: "WO-002",
    productName: "팬츠 리오더",
    reorderLabel: "리오더 1차",
    requestedMaterialLabel: "부자재 미배분",
    dueDateLabel: "납기 미정",
  },
];

export const initialMaterialOrderDraftLines: MaterialOrderDraftLine[] = [
  {
    id: "draft-line-1",
    itemName: "30수 면 블랙",
    unit: "마",
    orderQuantity: 10,
    unitPrice: 0,
  },
];

export function createMaterialOrderDraftLine(index: number): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${index}`,
    itemName: "",
    unit: "마",
    orderQuantity: 0,
    unitPrice: 0,
  };
}

export function getDefaultSupplierId(materialType: MaterialOrderDraftType): string {
  return materialOrderSupplierOptions.find((supplier) => supplier.materialType === materialType)?.id ?? "";
}
