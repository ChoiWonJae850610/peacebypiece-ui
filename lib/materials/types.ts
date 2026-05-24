export type MaterialKind = "fabric" | "submaterial";

export type MaterialLifecycleStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived";

export type MaterialOrderStatus =
  | "not_requested"
  | "request_pending"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type MaterialUnit =
  | "yd"
  | "m"
  | "roll"
  | "ea"
  | "set"
  | "pack"
  | "kg";

export type MaterialBase = {
  id: string;
  companyId: string;
  kind: MaterialKind;
  code: string;
  name: string;
  categoryId: string | null;
  partnerId: string | null;
  unit: MaterialUnit;
  lifecycleStatus: MaterialLifecycleStatus;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FabricMaterialAttributes = {
  composition: string | null;
  widthValue: number | null;
  widthUnit: "inch" | "cm" | null;
  weightValue: number | null;
  weightUnit: "gsm" | null;
  colorName: string | null;
};

export type SubmaterialAttributes = {
  specification: string | null;
  colorName: string | null;
  sizeLabel: string | null;
};

export type FabricMaterial = MaterialBase & {
  kind: "fabric";
  attributes: FabricMaterialAttributes;
};

export type Submaterial = MaterialBase & {
  kind: "submaterial";
  attributes: SubmaterialAttributes;
};

export type Material = FabricMaterial | Submaterial;

export type WorkorderMaterialLineRole =
  | "main_fabric"
  | "lining"
  | "trim"
  | "label"
  | "packaging"
  | "other";

export type WorkorderMaterialLine = {
  id: string;
  companyId: string;
  workorderId: string;
  materialId: string;
  role: WorkorderMaterialLineRole;
  requiredQuantity: number | null;
  unit: MaterialUnit;
  orderStatus: MaterialOrderStatus;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};


export type WorkorderMaterialLineWithMaterial = WorkorderMaterialLine & {
  material: Material;
};

export type WorkorderMaterialLineMutationInput = {
  companyId: string;
  workorderId: string;
  materialId: string;
  role: WorkorderMaterialLineRole;
  requiredQuantity?: number | null;
  unit: MaterialUnit;
  orderStatus?: MaterialOrderStatus;
  memo?: string | null;
};

export type MaterialRepositoryListParams = {
  companyId: string;
  kind?: MaterialKind;
  status?: MaterialLifecycleStatus;
  keyword?: string;
};

export type MaterialMutationInput = {
  companyId: string;
  kind: MaterialKind;
  code: string;
  name: string;
  categoryId?: string | null;
  partnerId?: string | null;
  unit: MaterialUnit;
  lifecycleStatus?: MaterialLifecycleStatus;
  memo?: string | null;
};

export type MaterialMockItem = {
  id: string;
  kind: MaterialKind;
  name: string;
  code: string;
  category: string;
  supplierName: string;
  unit: string;
  stockLabel: string;
  statusLabel: string;
  memo: string;
};

export type MaterialSummaryItem = {
  label: string;
  value: string;
  description: string;
};
