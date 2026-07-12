import type { EntityVersion, ProcessPatch } from "@/lib/domain/work-orders/contracts";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

const keys = new Set(["processName", "partnerId", "quantity", "dueDate", "unitCode", "unitPrice", "memo", "applicationArea", "applicationColorTarget"]);
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, field: string, max: number) => {
  if (value === null) return null;
  if (typeof value !== "string") throw new WorkOrderCommandValidationError([{ field, code: "INVALID_TYPE", message: "문자열을 입력해 주세요." }]);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > max) throw new WorkOrderCommandValidationError([{ field, code: "TOO_LONG", message: `${max}자 이하로 입력해 주세요.` }]);
  return normalized;
};

export function validatePatchProcess(body: unknown): { readonly clientRequestId: string; readonly expectedVersion: EntityVersion; readonly patch: ProcessPatch } {
  if (!object(body) || !object(body.patch)) throw new WorkOrderCommandValidationError([{ field: "body", code: "INVALID_TYPE", message: "JSON object 요청이 필요합니다." }]);
  for (const key of Object.keys(body.patch)) if (!keys.has(key)) throw new WorkOrderCommandValidationError([{ field: `patch.${key}`, code: "UNKNOWN_FIELD", message: "허용되지 않은 필드입니다." }]);
  if (Object.keys(body.patch).length === 0) throw new WorkOrderCommandValidationError([{ field: "patch", code: "EMPTY_PATCH", message: "변경할 공정 정보를 입력해 주세요." }]);
  if (typeof body.clientRequestId !== "string" || !body.clientRequestId.trim()) throw new WorkOrderCommandValidationError([{ field: "clientRequestId", code: "REQUIRED", message: "clientRequestId가 필요합니다." }]);
  if (!Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 1) throw new WorkOrderCommandValidationError([{ field: "expectedVersion", code: "REQUIRED", message: "expectedVersion이 필요합니다." }]);
  const patch = body.patch;
  const result: Record<string, unknown> = {};
  for (const field of ["processName", "partnerId", "unitCode"] as const) if (field in patch) result[field] = text(patch[field], `patch.${field}`, field === "processName" ? 200 : 120);
  for (const field of ["memo", "applicationArea", "applicationColorTarget"] as const) if (field in patch) result[field] = text(patch[field], `patch.${field}`, field === "memo" ? 2000 : 1000);
  for (const field of ["quantity", "unitPrice"] as const) if (field in patch) {
    if (typeof patch[field] !== "string" || !/^\d+(\.\d{1,4})?$/.test(patch[field])) throw new WorkOrderCommandValidationError([{ field: `patch.${field}`, code: "INVALID_FORMAT", message: "0 이상의 숫자 문자열을 입력해 주세요." }]);
    result[field] = patch[field];
  }
  if ("dueDate" in patch) {
    const dueDate = text(patch.dueDate, "patch.dueDate", 10);
    if (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new WorkOrderCommandValidationError([{ field: "patch.dueDate", code: "INVALID_FORMAT", message: "YYYY-MM-DD 형식이 필요합니다." }]);
    result.dueDate = dueDate;
  }
  return { clientRequestId: body.clientRequestId.trim(), expectedVersion: Number(body.expectedVersion) as EntityVersion, patch: result as ProcessPatch };
}
