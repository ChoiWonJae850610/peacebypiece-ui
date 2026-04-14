import { DEFAULT_UNSELECTED_OPTION, MATERIAL_KIND } from "@/lib/constants/workorderDomain";

export const MATERIAL_TYPE = {
  unselected: DEFAULT_UNSELECTED_OPTION,
  fabric: MATERIAL_KIND.fabric,
  subsidiary: MATERIAL_KIND.subsidiary,
  other: MATERIAL_KIND.other,
} as const;

export type MaterialTypeValue = (typeof MATERIAL_TYPE)[keyof typeof MATERIAL_TYPE];

export const MATERIAL_UNIT = {
  yard: "yd",
  meter: "m",
  piece: "개",
  pcs: "pcs",
  sheet: "장",
  roll: "롤",
  kilogram: "kg",
} as const;

export type MaterialUnitValue = (typeof MATERIAL_UNIT)[keyof typeof MATERIAL_UNIT];

export const MATERIAL_STATUS = {
  ready: "준비",
  preparing: "준비중",
  ordered: "발주완료",
  received: "입고완료",
  preparingEn: "Preparing",
  orderedEn: "Ordered",
  receivedEn: "Received",
} as const;

export type MaterialStatusValue = (typeof MATERIAL_STATUS)[keyof typeof MATERIAL_STATUS];

export const MATERIAL_TYPE_OPTIONS = [
  MATERIAL_TYPE.unselected,
  MATERIAL_TYPE.fabric,
  MATERIAL_TYPE.subsidiary,
  MATERIAL_TYPE.other,
] as const satisfies readonly MaterialTypeValue[];

export const MATERIAL_UNIT_OPTIONS = [
  MATERIAL_UNIT.yard,
  MATERIAL_UNIT.meter,
  MATERIAL_UNIT.piece,
  MATERIAL_UNIT.pcs,
  MATERIAL_UNIT.sheet,
  MATERIAL_UNIT.roll,
  MATERIAL_UNIT.kilogram,
] as const satisfies readonly MaterialUnitValue[];
