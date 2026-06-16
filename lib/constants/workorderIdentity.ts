export const WORK_ORDER_KIND = {
  sample: "sample",
  main: "main",
  rework: "rework",
} as const;

export const WORK_ORDER_KINDS = [
  WORK_ORDER_KIND.sample,
  WORK_ORDER_KIND.main,
  WORK_ORDER_KIND.rework,
] as const;

export type WorkOrderKindValue = (typeof WORK_ORDER_KINDS)[number];

export function isWorkOrderKindValue(value: string | null | undefined): value is WorkOrderKindValue {
  return WORK_ORDER_KINDS.includes(value as WorkOrderKindValue);
}

export function normalizeWorkOrderKindValue(
  value: string | null | undefined,
  fallback: WorkOrderKindValue = WORK_ORDER_KIND.sample,
): WorkOrderKindValue {
  const normalized = String(value ?? "").trim();
  return isWorkOrderKindValue(normalized) ? normalized : fallback;
}

export const WORK_ORDER_KIND_RANK: Record<WorkOrderKindValue, number> = {
  [WORK_ORDER_KIND.main]: 0,
  [WORK_ORDER_KIND.rework]: 1,
  [WORK_ORDER_KIND.sample]: 2,
};

export const WORK_ORDER_ORDER_TYPE = {
  main: "메인 생산",
  sample: "샘플",
  rework: "재작업",
} as const;

export type WorkOrderOrderTypeValue = (typeof WORK_ORDER_ORDER_TYPE)[keyof typeof WORK_ORDER_ORDER_TYPE];

export function getWorkOrderKindFromOrderTypeValue(orderType: string | null | undefined): WorkOrderKindValue {
  const normalizedType = String(orderType ?? "").trim();
  if (normalizedType === WORK_ORDER_ORDER_TYPE.sample) return WORK_ORDER_KIND.sample;
  if (normalizedType === WORK_ORDER_ORDER_TYPE.rework) return WORK_ORDER_KIND.rework;
  return WORK_ORDER_KIND.main;
}

export function getOrderTypeFromWorkOrderKindValue(kind: WorkOrderKindValue | null | undefined): WorkOrderOrderTypeValue {
  const normalizedKind = normalizeWorkOrderKindValue(kind, WORK_ORDER_KIND.main);
  if (normalizedKind === WORK_ORDER_KIND.sample) return WORK_ORDER_ORDER_TYPE.sample;
  if (normalizedKind === WORK_ORDER_KIND.rework) return WORK_ORDER_ORDER_TYPE.rework;
  return WORK_ORDER_ORDER_TYPE.main;
}

export const ATTACHMENT_SCOPE = {
  design: "design",
  attachment: "attachment",
} as const;

export const ATTACHMENT_SCOPES = [
  ATTACHMENT_SCOPE.design,
  ATTACHMENT_SCOPE.attachment,
] as const;

export const UPLOADABLE_ATTACHMENT_SCOPES = [
  ATTACHMENT_SCOPE.design,
  ATTACHMENT_SCOPE.attachment,
] as const;

export type AttachmentScopeValue = (typeof ATTACHMENT_SCOPES)[number];
export type UploadableAttachmentScopeValue = (typeof UPLOADABLE_ATTACHMENT_SCOPES)[number];

export function isAttachmentScopeValue(value: string | null | undefined): value is AttachmentScopeValue {
  return ATTACHMENT_SCOPES.includes(value as AttachmentScopeValue);
}

export function isUploadableAttachmentScopeValue(value: string | null | undefined): value is UploadableAttachmentScopeValue {
  return UPLOADABLE_ATTACHMENT_SCOPES.includes(value as UploadableAttachmentScopeValue);
}

export function normalizeAttachmentScopeValue(
  value: string | null | undefined,
  fallback: AttachmentScopeValue = ATTACHMENT_SCOPE.attachment,
): AttachmentScopeValue {
  const normalized = String(value ?? "").trim();
  return isAttachmentScopeValue(normalized) ? normalized : fallback;
}

export function normalizeUploadableAttachmentScopeValue(
  value: string | null | undefined,
  fallback: UploadableAttachmentScopeValue = ATTACHMENT_SCOPE.attachment,
): UploadableAttachmentScopeValue {
  const normalized = String(value ?? "").trim();
  return isUploadableAttachmentScopeValue(normalized) ? normalized : fallback;
}

export function isDesignAttachmentScope(value: string | null | undefined): boolean {
  return normalizeAttachmentScopeValue(value) === ATTACHMENT_SCOPE.design;
}

