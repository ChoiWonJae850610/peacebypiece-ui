export const WORK_ORDER_STATUSES = [
  "draft",
  "ready_to_issue",
  "issued",
  "revised",
  "cancelled",
  "completed",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUS_LABELS = {
  draft: "작성중",
  ready_to_issue: "발행 준비",
  issued: "발행됨",
  revised: "정정 작성중",
  cancelled: "취소",
  completed: "완료",
} as const satisfies Record<WorkOrderStatus, string>;

export const WORK_ORDER_REVISION_STATUSES = [
  "draft",
  "finalized",
  "superseded",
  "cancelled",
] as const;

export type WorkOrderRevisionStatus = (typeof WORK_ORDER_REVISION_STATUSES)[number];

export const MATERIAL_LINE_STATUSES = [
  "editing",
  "requested",
  "completed",
  "cancelled",
] as const;

export type MaterialLineStatus = (typeof MATERIAL_LINE_STATUSES)[number];

export const MATERIAL_LINE_STATUS_LABELS = {
  editing: "입력중",
  requested: "발주 요청",
  completed: "발주 완료",
  cancelled: "요청 취소",
} as const satisfies Record<MaterialLineStatus, string>;

export const PROCESS_STATUSES = ["ready", "in_progress", "completed"] as const;
export type ProcessStatus = (typeof PROCESS_STATUSES)[number];

export const PROCESS_STATUS_LABELS = {
  ready: "준비",
  in_progress: "작업중",
  completed: "완료",
} as const satisfies Record<ProcessStatus, string>;

export const GENERATED_DOCUMENT_STATUSES = [
  "pending",
  "generated",
  "failed",
  "revoked",
  "deleted",
] as const;

export type GeneratedDocumentStatus = (typeof GENERATED_DOCUMENT_STATUSES)[number];

export const GENERATED_DOCUMENT_STATUS_LABELS = {
  pending: "생성 대기",
  generated: "생성 완료",
  failed: "생성 실패",
  revoked: "공유 취소",
  deleted: "삭제됨",
} as const satisfies Record<GeneratedDocumentStatus, string>;

export const WORK_ORDER_DOCUMENT_TYPES = [
  "work_instruction",
  "factory_instruction",
  "delivery_request",
] as const;

export type WorkOrderDocumentType = (typeof WORK_ORDER_DOCUMENT_TYPES)[number];

export type MaterialType = "fabric" | "accessory";
export type MeasurementUnit = "cm" | "inch";
export type TrashScope = "active" | "trash" | "all";
export type ImageAssetState = "active" | "deleted";
