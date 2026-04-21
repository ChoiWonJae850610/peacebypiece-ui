export const DEFAULT_UNSELECTED_OPTION = "선택 안함" as const;
export const DEFAULT_UNASSIGNED_FACTORY_LABEL = "미정 공장" as const;

export const MATERIAL_KIND = {
  unselected: DEFAULT_UNSELECTED_OPTION,
  fabric: "원단",
  subsidiary: "부자재",
  other: "기타",
} as const;

export type MaterialKindValue = (typeof MATERIAL_KIND)[keyof typeof MATERIAL_KIND];

export const INVENTORY_STATUS = {
  unchecked: "unchecked",
  normal: "normal",
  shortage: "shortage",
} as const;

export type InventoryStatusValue = (typeof INVENTORY_STATUS)[keyof typeof INVENTORY_STATUS];

export const INVENTORY_STATUS_LABELS: Record<InventoryStatusValue, string> = {
  [INVENTORY_STATUS.unchecked]: "확인전",
  [INVENTORY_STATUS.normal]: "정상",
  [INVENTORY_STATUS.shortage]: "부족",
};

export const LEGACY_INVENTORY_STATUS_MAP = {
  확인전: INVENTORY_STATUS.unchecked,
  정상: INVENTORY_STATUS.normal,
  부족: INVENTORY_STATUS.shortage,
} as const;

export function toInventoryStatus(value: unknown): InventoryStatusValue {
  if (value === INVENTORY_STATUS.unchecked || value === INVENTORY_STATUS.normal || value === INVENTORY_STATUS.shortage) return value;
  if (typeof value === "string" && value in LEGACY_INVENTORY_STATUS_MAP) return LEGACY_INVENTORY_STATUS_MAP[value as keyof typeof LEGACY_INVENTORY_STATUS_MAP];
  return INVENTORY_STATUS.unchecked;
}

export function getInventoryStatusLabel(value: unknown): string {
  return INVENTORY_STATUS_LABELS[toInventoryStatus(value)];
}

export const INVENTORY_CHANGE_TYPE = {
  inbound: "입고",
  deduction: "차감",
  adjustment: "보정",
} as const;

export type InventoryChangeTypeValue = (typeof INVENTORY_CHANGE_TYPE)[keyof typeof INVENTORY_CHANGE_TYPE];

export const INVENTORY_CHANGE_LABELS = [
  INVENTORY_CHANGE_TYPE.inbound,
  INVENTORY_CHANGE_TYPE.deduction,
  INVENTORY_CHANGE_TYPE.adjustment,
] as const satisfies readonly InventoryChangeTypeValue[];

export const REGISTRY_TYPE = {
  partner: "partner",
  factory: "factory",
  materialVendor: "material_vendor",
  subsidiaryVendor: "subsidiary_vendor",
} as const;

export type RegistryTypeValue = (typeof REGISTRY_TYPE)[keyof typeof REGISTRY_TYPE];

export const REGISTRY_TYPE_LABELS: Record<RegistryTypeValue, string> = {
  [REGISTRY_TYPE.partner]: "거래처",
  [REGISTRY_TYPE.factory]: "공장",
  [REGISTRY_TYPE.materialVendor]: "원단 거래처",
  [REGISTRY_TYPE.subsidiaryVendor]: "부자재 거래처",
};

export const VENDOR_REGISTRY_TYPES = [
  REGISTRY_TYPE.partner,
  REGISTRY_TYPE.materialVendor,
  REGISTRY_TYPE.subsidiaryVendor,
] as const satisfies readonly RegistryTypeValue[];

export const LEGACY_REGISTRY_TYPE_MAP = {
  거래처: REGISTRY_TYPE.partner,
  공장: REGISTRY_TYPE.factory,
  원단거래처: REGISTRY_TYPE.materialVendor,
  "원단 거래처": REGISTRY_TYPE.materialVendor,
  부자재거래처: REGISTRY_TYPE.subsidiaryVendor,
  "부자재 거래처": REGISTRY_TYPE.subsidiaryVendor,
} as const;

export function toRegistryType(value: unknown): RegistryTypeValue {
  if (typeof value === "string") {
    if (Object.values(REGISTRY_TYPE).includes(value as RegistryTypeValue)) return value as RegistryTypeValue;
    if (value in LEGACY_REGISTRY_TYPE_MAP) return LEGACY_REGISTRY_TYPE_MAP[value as keyof typeof LEGACY_REGISTRY_TYPE_MAP];
  }
  return REGISTRY_TYPE.partner;
}

export function isVendorRegistryType(value: unknown): value is (typeof VENDOR_REGISTRY_TYPES)[number] {
  const normalized = toRegistryType(value);
  return normalized === REGISTRY_TYPE.partner || normalized === REGISTRY_TYPE.materialVendor || normalized === REGISTRY_TYPE.subsidiaryVendor;
}

export const EMPTY_SELECTION_VALUES = [DEFAULT_UNSELECTED_OPTION, DEFAULT_UNASSIGNED_FACTORY_LABEL] as const;
export type EmptySelectionValue = (typeof EMPTY_SELECTION_VALUES)[number];

export const ORDER_FACTORY_UNSELECTABLE_VALUES = [
  DEFAULT_UNSELECTED_OPTION,
  DEFAULT_UNASSIGNED_FACTORY_LABEL,
  "선택안함",
  "placeholder",
  "",
] as const;
export type OrderFactoryUnselectableValue = (typeof ORDER_FACTORY_UNSELECTABLE_VALUES)[number];

export const ORDER_ENTRY_TARGET_TYPE = {
  factory: "factory",
  fabric: "fabric",
  subsidiary: "subsidiary",
} as const;

export type OrderEntryTargetTypeValue = (typeof ORDER_ENTRY_TARGET_TYPE)[keyof typeof ORDER_ENTRY_TARGET_TYPE];

export const ORDER_ENTRY_TARGET_TYPE_LABELS: Record<OrderEntryTargetTypeValue, string> = {
  [ORDER_ENTRY_TARGET_TYPE.factory]: "공장",
  [ORDER_ENTRY_TARGET_TYPE.fabric]: "원단",
  [ORDER_ENTRY_TARGET_TYPE.subsidiary]: "부자재",
};

export const ORDER_ENTRY_TARGET_TYPE_VALUES = Object.values(ORDER_ENTRY_TARGET_TYPE) as OrderEntryTargetTypeValue[];

export function toOrderEntryTargetType(value: unknown): OrderEntryTargetTypeValue {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (ORDER_ENTRY_TARGET_TYPE_VALUES.includes(normalized as OrderEntryTargetTypeValue)) {
      return normalized as OrderEntryTargetTypeValue;
    }
    if (normalized === "원단") return ORDER_ENTRY_TARGET_TYPE.fabric;
    if (normalized === "부자재") return ORDER_ENTRY_TARGET_TYPE.subsidiary;
  }
  return ORDER_ENTRY_TARGET_TYPE.factory;
}

export function isOrderEntryTargetType(value: unknown): value is OrderEntryTargetTypeValue {
  return ORDER_ENTRY_TARGET_TYPE_VALUES.includes(String(value ?? "").trim() as OrderEntryTargetTypeValue);
}

export const ORDER_REQUEST_TABLE_COLUMNS = [
  { key: "type", label: "구분", align: "left" },
  { key: "factory", label: "공장", align: "left" },
  { key: "dueDate", label: "납기일", align: "left" },
  { key: "quantity", label: "수량", align: "right" },
  { key: "laborCost", label: "공임비", align: "right" },
  { key: "lossCost", label: "로스비", align: "right" },
] as const;

export function isInventoryChangeType(value: unknown): value is InventoryChangeTypeValue {
  return INVENTORY_CHANGE_LABELS.includes(value as InventoryChangeTypeValue);
}

export function isEmptySelectionValue(value: unknown): value is EmptySelectionValue {
  return EMPTY_SELECTION_VALUES.includes(value as EmptySelectionValue);
}
