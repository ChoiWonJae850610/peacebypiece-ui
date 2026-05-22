import {
  WORKORDER_SERVICE_CODE,
  isWorkOrderServiceCode,
  type WorkOrderServiceCodeValue,
} from "@/lib/constants/workorderServiceCodes";

export type WorkOrderServiceCodeRequestError =
  | "WORKORDER_SERVICE_CODE_INVALID"
  | "WORKORDER_SERVICE_CODE_MISMATCH";

export function readWorkOrderServiceCode(value: unknown): WorkOrderServiceCodeValue | null {
  return isWorkOrderServiceCode(value) ? value : null;
}

export function resolveWorkOrderServiceCodeForRequest(input: {
  expected: WorkOrderServiceCodeValue;
  received: unknown;
}): {
  ok: true;
  serviceCode: WorkOrderServiceCodeValue;
} | {
  ok: false;
  error: WorkOrderServiceCodeRequestError;
  expected: WorkOrderServiceCodeValue;
  received: string | null;
} {
  const rawReceived = typeof input.received === "string" && input.received.trim().length > 0
    ? input.received.trim()
    : null;

  if (!rawReceived) {
    return { ok: true, serviceCode: input.expected };
  }

  if (!isWorkOrderServiceCode(rawReceived)) {
    return {
      ok: false,
      error: "WORKORDER_SERVICE_CODE_INVALID",
      expected: input.expected,
      received: rawReceived,
    };
  }

  if (rawReceived !== input.expected) {
    return {
      ok: false,
      error: "WORKORDER_SERVICE_CODE_MISMATCH",
      expected: input.expected,
      received: rawReceived,
    };
  }

  return { ok: true, serviceCode: rawReceived };
}

export function getAttachmentPrepareServiceCodeByScope(scope: string | null | undefined): WorkOrderServiceCodeValue {
  return scope === "design"
    ? WORKORDER_SERVICE_CODE.designAttachmentPrepare
    : WORKORDER_SERVICE_CODE.fileAttachmentPrepare;
}
