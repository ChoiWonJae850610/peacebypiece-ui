import type {
  MaterialKind,
  MaterialLifecycleStatus,
  MaterialOrderStatus,
  MaterialUnit,
  WorkorderMaterialLineRole,
} from "@/lib/materials/types";

export const MATERIAL_KIND_VALUES = ["fabric", "submaterial"] as const satisfies readonly MaterialKind[];

export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  fabric: "원단",
  submaterial: "부자재",
};

export const MATERIAL_KIND_DESCRIPTIONS: Record<MaterialKind, string> = {
  fabric: "원단 폭, 혼용률, 거래처, 단위, 발주 상태를 이후 DB 구조와 연결합니다.",
  submaterial: "단추, 지퍼, 라벨, 포장재 등 작업지시서 생산 구성에 필요한 항목을 분리합니다.",
};

export const MATERIAL_LIFECYCLE_STATUS_VALUES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const satisfies readonly MaterialLifecycleStatus[];

export const MATERIAL_LIFECYCLE_STATUS_LABELS: Record<MaterialLifecycleStatus, string> = {
  draft: "작성중",
  active: "사용중",
  inactive: "사용중지",
  archived: "보관",
};

export const MATERIAL_ORDER_STATUS_VALUES = [
  "not_requested",
  "request_pending",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const satisfies readonly MaterialOrderStatus[];

export const MATERIAL_ORDER_STATUS_LABELS: Record<MaterialOrderStatus, string> = {
  not_requested: "발주 전",
  request_pending: "발주 요청",
  ordered: "발주 완료",
  partially_received: "부분 입고",
  received: "입고 완료",
  cancelled: "취소",
};

export const MATERIAL_UNIT_VALUES = [
  "yd",
  "m",
  "roll",
  "ea",
  "set",
  "pack",
  "kg",
] as const satisfies readonly MaterialUnit[];

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  yd: "yd",
  m: "m",
  roll: "roll",
  ea: "개",
  set: "set",
  pack: "pack",
  kg: "kg",
};

export const WORKORDER_MATERIAL_LINE_ROLE_VALUES = [
  "main_fabric",
  "lining",
  "trim",
  "label",
  "packaging",
  "other",
] as const satisfies readonly WorkorderMaterialLineRole[];

export const WORKORDER_MATERIAL_LINE_ROLE_LABELS: Record<WorkorderMaterialLineRole, string> = {
  main_fabric: "메인 원단",
  lining: "안감",
  trim: "부속",
  label: "라벨",
  packaging: "포장재",
  other: "기타",
};

export const MATERIAL_DATABASE_DESIGN_VERSION = "0.16.17" as const;
