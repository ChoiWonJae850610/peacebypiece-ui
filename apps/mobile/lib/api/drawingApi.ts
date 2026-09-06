import type { DrawingSceneV1 } from "@/domain/drawing";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";

export type WorkOrderDrawingReadModel = Readonly<{
  drawingId: string | null;
  drawingVersion: number;
  schemaVersion: 1;
  scene: DrawingSceneV1;
  updatedAt: string | null;
}>;

function drawing(value: unknown): WorkOrderDrawingReadModel {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "스케치 응답이 올바르지 않습니다." });
  const candidate = value as Partial<WorkOrderDrawingReadModel>;
  if ((candidate.drawingId !== null && typeof candidate.drawingId !== "string")
    || !Number.isSafeInteger(candidate.drawingVersion) || Number(candidate.drawingVersion) < 0
    || candidate.schemaVersion !== 1 || !candidate.scene) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "스케치 응답이 올바르지 않습니다." });
  }
  return candidate as WorkOrderDrawingReadModel;
}

export async function getPrimaryWorkOrderDrawing(workOrderId: string) {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/drawings/primary-sketch`,
    { method: "GET" },
  );
  if (!body.ok) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "스케치를 불러오지 못했습니다." });
  return drawing(body.data);
}

export async function savePrimaryWorkOrderDrawing(workOrderId: string, input: Readonly<{
  clientRequestId: string;
  drawingId: string | null;
  expectedVersion: number;
  scene: DrawingSceneV1;
}>, idempotencyKey: string) {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/drawings/primary-sketch`,
    { method: "PATCH", body: input, idempotencyKey, timeoutMs: 120_000 },
  );
  if (!body.ok) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "스케치를 저장하지 못했습니다." });
  return drawing(body.data);
}
