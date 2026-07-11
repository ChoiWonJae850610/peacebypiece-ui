import type { CorrelationId, EntityVersion } from "@/lib/domain/work-orders/contracts/primitives";

export const WORK_ORDER_API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "TENANT_SCOPE_VIOLATION",
  "NOT_FOUND",
  "CONFLICT",
  "LOCKED",
  "INVALID_STATE_TRANSITION",
  "REVISION_MISMATCH",
  "DOCUMENT_NOT_READY",
  "QUANTITY_TOTAL_MISMATCH",
  "REPRESENTATIVE_IMAGE_REQUIRED",
  "MATERIAL_REQUIRED",
  "DUE_DATE_REQUIRED",
  "PARTNER_REQUIRED",
  "CURSOR_INVALID",
  "LIMIT_EXCEEDED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type WorkOrderApiErrorCode = (typeof WORK_ORDER_API_ERROR_CODES)[number];

export type WorkOrderFieldError = {
  readonly field: string;
  readonly code: string;
  readonly message: string;
};

export type WorkOrderApiErrorEnvelope = {
  readonly error: {
    readonly code: WorkOrderApiErrorCode;
    readonly message: string;
    readonly fieldErrors?: readonly WorkOrderFieldError[];
    readonly entityVersion?: EntityVersion;
    readonly retryable: boolean;
    readonly correlationId: CorrelationId;
  };
};
