import { DEFAULT_UNSELECTED_OPTION, REGISTRY_TYPE } from "@/lib/constants/workorderDomain";
import { MATERIAL_STATUS, MATERIAL_TYPE, MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT, MATERIAL_UNIT_OPTIONS } from "@/lib/constants/material";
import { DEFAULT_NEW_MATERIAL_NAME } from "@/lib/workorder/material/materialDefaults";

export const OUTSOURCING_PROCESS_OPTIONS = [DEFAULT_UNSELECTED_OPTION, "재단", "봉제", "나염", "자수", "워싱", "후가공", "기타"] as const;
export const OUTSOURCING_UNIT_OPTIONS = ["장", "개", "벌", "세트", "롤"] as const;

export { CATEGORY_TREE, CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";

export const SEASON_OPTIONS = ["SS", "FW", "NOS", "ALL"] as const;
const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => String(currentYear - 2 + index));
export const PRIORITY_OPTIONS = ["긴급", "일반", "여유"] as const;
export const ORDER_TYPE_OPTIONS = ["메인 생산", "샘플", "재작업"] as const;

export type SupportedOrderType = (typeof ORDER_TYPE_OPTIONS)[number];

export function isSupportedOrderType(value: string | null | undefined): value is SupportedOrderType {
  return ORDER_TYPE_OPTIONS.includes(String(value ?? "").trim() as SupportedOrderType);
}

export const PARTNER_OPTIONS = [DEFAULT_UNSELECTED_OPTION, "에이원 트레이딩", "루나텍스타일", "해성어패럴"] as const;
export const FACTORY_OPTIONS = [DEFAULT_UNSELECTED_OPTION, "한빛팩토리", "동명봉제", "세림공장"] as const;
export const REGISTRY_TYPE_OPTIONS = [REGISTRY_TYPE.partner, REGISTRY_TYPE.factory] as const;
export const EXTENDED_REGISTRY_TYPE_OPTIONS = [
  REGISTRY_TYPE.partner,
  REGISTRY_TYPE.factory,
  REGISTRY_TYPE.materialVendor,
  REGISTRY_TYPE.subsidiaryVendor,
] as const;
export const VENDOR_REGISTRY_TYPE_OPTIONS = [
  REGISTRY_TYPE.partner,
  REGISTRY_TYPE.materialVendor,
  REGISTRY_TYPE.subsidiaryVendor,
] as const;

export const DEFAULT_MATERIAL_TYPE = MATERIAL_TYPE.unselected;
export const DEFAULT_MATERIAL_UNIT = MATERIAL_UNIT.yard;
export const DEFAULT_OUTSOURCING_PROCESS = DEFAULT_UNSELECTED_OPTION;
export const DEFAULT_OUTSOURCING_UNIT = "개" as const;
export const DEFAULT_ORDER_TYPE = "메인 생산" as const;
export const DEFAULT_PRIORITY_OPTION = (PRIORITY_OPTIONS[1] ?? PRIORITY_OPTIONS[0]) as string;
export const DEFAULT_BASIC_YEAR = String(currentYear) as string;
export const DEFAULT_PARTNER_OPTION = PARTNER_OPTIONS[0] as string;
export const DEFAULT_FACTORY_OPTION = FACTORY_OPTIONS[0] as string;
export const DEFAULT_REGISTRY_TYPE = REGISTRY_TYPE_OPTIONS[0];

export { MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT_OPTIONS, DEFAULT_NEW_MATERIAL_NAME };
export const DEFAULT_MATERIAL_STATUS = MATERIAL_STATUS.ready;
export const DEFAULT_OUTSOURCING_STATUS = "대기" as const;


export function getAvailableOrderTypeOptions(args: {
  workOrderKind?: string | null;
  isDefectOrder?: boolean | null;
}): readonly SupportedOrderType[] {
  const kind = String(args.workOrderKind ?? "").trim();
  const isRework = kind === "rework" || Boolean(args.isDefectOrder);
  const isSample = kind === "sample" && !isRework;

  if (isSample) return ORDER_TYPE_OPTIONS;
  return ORDER_TYPE_OPTIONS.filter((option) => option !== "샘플");
}
