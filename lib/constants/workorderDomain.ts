export const DEFAULT_UNSELECTED_OPTION = "선택 안함" as const;
export const DEFAULT_UNASSIGNED_FACTORY_LABEL = "미정 공장" as const;

export const MATERIAL_KIND = {
  unselected: DEFAULT_UNSELECTED_OPTION,
  fabric: "원단",
  subsidiary: "부자재",
  other: "기타",
} as const;

export type MaterialKindValue = (typeof MATERIAL_KIND)[keyof typeof MATERIAL_KIND];

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

export const EMPTY_SELECTION_VALUES = [DEFAULT_UNSELECTED_OPTION, DEFAULT_UNASSIGNED_FACTORY_LABEL] as const;
export type EmptySelectionValue = (typeof EMPTY_SELECTION_VALUES)[number];

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
