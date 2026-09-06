import "server-only";

import { createHash, randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantReadOnlyTransaction, withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { createCommandErrorResponse, mapCommandGuardFailureStatus } from "@/lib/domain/work-orders/command/commandRoute";
import { getWorkOrderV2DrawingMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import { createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId, EntityVersion } from "@/lib/domain/work-orders/contracts";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import { createDrawingScene, serializeDrawingScene, validateDrawingScene, type DrawingSceneV1 } from "@/lib/domain/drawing";

const DRAWING_SLOT_KEY = "primary_sketch";
const DRAWING_SAVE_COMMAND_CODE = "drawing.save";
const DRAWING_REQUEST_MAX_BYTES = 2 * 1024 * 1024;
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

type DrawingRow = DbQueryResultRow & {
  readonly id: string;
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly schema_version: number | string;
  readonly scene_json: unknown;
  readonly entity_version: number | string;
  readonly updated_at: Date | string;
};

type SaveBody = Readonly<{
  clientRequestId?: unknown;
  drawingId?: unknown;
  expectedVersion?: unknown;
  scene?: unknown;
}>;

function responseDrawing(row: DrawingRow | null) {
  const scene = row ? validateDrawingScene(row.scene_json) : { ok: true as const, scene: createDrawingScene() };
  if (!scene.ok) throw new Error("INVALID_STORED_SCENE");
  return Object.freeze({
    drawingId: row?.id ?? null,
    drawingVersion: row ? Number(row.entity_version) : 0,
    schemaVersion: scene.scene.schemaVersion,
    scene: scene.scene,
    updatedAt: row ? new Date(row.updated_at).toISOString() : null,
  });
}

async function readBody(request: Request): Promise<SaveBody> {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > DRAWING_REQUEST_MAX_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_BODY");
    return parsed as SaveBody;
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") throw error;
    throw new Error("INVALID_BODY");
  }
}

function validateSaveBody(body: SaveBody): Readonly<{
  clientRequestId: string;
  drawingId: string | null;
  expectedVersion: number;
  scene: DrawingSceneV1;
}> {
  const keys = Object.keys(body as Record<string, unknown>);
  if (keys.some((key) => !new Set(["clientRequestId", "drawingId", "expectedVersion", "scene"]).has(key))) throw new Error("INVALID_BODY");
  if (!ID_PATTERN.test(String(body.clientRequestId ?? ""))) throw new Error("INVALID_BODY");
  if (!Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 0) throw new Error("INVALID_BODY");
  const drawingId = body.drawingId === null ? null : String(body.drawingId ?? "");
  if (drawingId !== null && !/^[0-9a-f-]{36}$/i.test(drawingId)) throw new Error("INVALID_BODY");
  if ((Number(body.expectedVersion) === 0) !== (drawingId === null)) throw new Error("INVALID_BODY");
  const parsed = validateDrawingScene(body.scene);
  if (!parsed.ok) throw new Error("INVALID_SCENE");
  return Object.freeze({
    clientRequestId: String(body.clientRequestId),
    drawingId,
    expectedVersion: Number(body.expectedVersion),
    scene: parsed.scene,
  });
}

function errorResponse(reason: string, correlationId: CorrelationId, entityVersion?: number) {
  if (reason === "NOT_FOUND") return createCommandErrorResponse({ code: "NOT_FOUND", message: "스케치를 찾을 수 없습니다.", status: 404, correlationId });
  if (reason === "LOCKED") return createCommandErrorResponse({ code: "LOCKED", message: "초안 레시피의 스케치만 저장할 수 있습니다.", status: 409, correlationId });
  if (reason === "CONFLICT") return createCommandErrorResponse({ code: "CONFLICT", message: "다른 스케치 변경이 먼저 저장되었습니다. 최신 내용을 다시 확인해 주세요.", status: 409, correlationId, ...(entityVersion && entityVersion > 0 ? { entityVersion: entityVersion as EntityVersion } : {}) });
  if (reason === "IDEMPOTENCY_CONFLICT") return createCommandErrorResponse({ code: "CONFLICT", message: "같은 요청 식별값이 다른 저장에 사용되었습니다.", status: 409, correlationId });
  if (reason === "PAYLOAD_TOO_LARGE") return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: "스케치 데이터가 너무 큽니다.", status: 413, correlationId });
  if (reason === "INVALID_BODY" || reason === "INVALID_SCENE") return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: "스케치 데이터를 확인해 주세요.", status: 400, correlationId });
  return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "스케치를 처리하지 못했습니다.", status: 500, retryable: true, correlationId });
}

export async function handleGetPrimaryWorkOrderDrawing(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2ReadRuntimeGuard().ok) return createCommandErrorResponse({ code: "FORBIDDEN", message: "승인된 dev/test Runtime에서만 스케치를 불러올 수 있습니다.", status: 403, correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  try {
    const result = await withWaflV2TenantReadOnlyTransaction(async (client) => {
      await client.query("SELECT set_config('wafl.company_id',$1,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$2,true)", [guard.scope.companyId, correlationId]);
      const target = await client.query<DbQueryResultRow>(`SELECT 1 FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL`, [guard.scope.companyId, workOrderId]);
      if (!target.rows[0]) throw new Error("NOT_FOUND");
      const row = (await client.query<DrawingRow>(`SELECT d.id,d.work_order_id,d.revision_id,d.schema_version,d.scene_json,d.entity_version,d.updated_at FROM work_order_drawings d JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id WHERE d.company_id=$1 AND d.work_order_id=$2::uuid AND d.revision_id=w.current_revision_id AND d.slot_key=$3`, [guard.scope.companyId, workOrderId, DRAWING_SLOT_KEY])).rows[0] ?? null;
      return responseDrawing(row);
    });
    return createWaflApiSuccess(result, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "INTERNAL";
    if (!new Set(["NOT_FOUND", "INVALID_STORED_SCENE"]).has(reason)) console.error("[WORK_ORDER_DRAWING_READ_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "Unknown" });
    return errorResponse(reason, correlationId);
  }
}

export async function handleSavePrimaryWorkOrderDrawing(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2DrawingMutationRuntimeGuard().ok) return createCommandErrorResponse({ code: "FORBIDDEN", message: "승인된 dev/test Runtime에서만 스케치를 저장할 수 있습니다.", status: 403, correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  try {
    const body = validateSaveBody(await readBody(request));
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
    if (!ID_PATTERN.test(idempotencyKey)) throw new Error("INVALID_BODY");
    const scope = createCommandTenantScope({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, permissionCode: "workorder.update" });
    const serialized = serializeDrawingScene(body.scene);
    const requestHash = createHash("sha256").update(JSON.stringify({ workOrderId, drawingId: body.drawingId, expectedVersion: body.expectedVersion, scene: serialized })).digest("hex");
    const scopedKey = createHash("sha256").update(`${scope.companyId}\0${DRAWING_SAVE_COMMAND_CODE}\0${idempotencyKey}`).digest("hex");
    const result = await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, scope);
      const existingReceipt = (await client.query<DbQueryResultRow & { request_sha256: string; result_entity_version: number | string | null; work_order_id: string | null; result_revision_id: string | null }>(`SELECT request_sha256,result_entity_version,work_order_id,result_revision_id FROM work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [scope.companyId, DRAWING_SAVE_COMMAND_CODE, scopedKey])).rows[0];
      if (existingReceipt) {
        if (existingReceipt.request_sha256 !== requestHash || existingReceipt.result_entity_version === null) throw new Error("IDEMPOTENCY_CONFLICT");
        const replay = (await client.query<DrawingRow>(`SELECT id,work_order_id,revision_id,schema_version,scene_json,entity_version,updated_at FROM work_order_drawings WHERE company_id=$1 AND work_order_id=$2::uuid AND revision_id=$3::uuid AND slot_key=$4`, [scope.companyId, workOrderId, existingReceipt.result_revision_id, DRAWING_SLOT_KEY])).rows[0];
        if (!replay) throw new Error("IDEMPOTENCY_CONFLICT");
        return { drawing: responseDrawing(replay), idempotentReplay: true };
      }
      const target = (await client.query<DbQueryResultRow & { revision_id: string; work_order_status: string; revision_status: string }>(`SELECT w.current_revision_id revision_id,w.status work_order_status,r.revision_status FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL FOR UPDATE OF w,r`, [scope.companyId, workOrderId])).rows[0];
      if (!target) throw new Error("NOT_FOUND");
      if (target.work_order_status !== "draft" || target.revision_status !== "draft") throw new Error("LOCKED");
      const current = (await client.query<DrawingRow>(`SELECT id,work_order_id,revision_id,schema_version,scene_json,entity_version,updated_at FROM work_order_drawings WHERE company_id=$1 AND revision_id=$2::uuid AND slot_key=$3 FOR UPDATE`, [scope.companyId, target.revision_id, DRAWING_SLOT_KEY])).rows[0] ?? null;
      const currentVersion = current ? Number(current.entity_version) : 0;
      if (currentVersion !== body.expectedVersion || (current?.id ?? null) !== body.drawingId) {
        const conflict = new Error("CONFLICT") as Error & { entityVersion?: number };
        conflict.entityVersion = currentVersion;
        throw conflict;
      }
      await client.query(`INSERT INTO work_order_command_receipts(company_id,command_code,idempotency_key,request_sha256,correlation_id) VALUES($1,$2,$3,$4,$5)`, [scope.companyId, DRAWING_SAVE_COMMAND_CODE, scopedKey, requestHash, correlationId]);
      const saved = current
        ? (await client.query<DrawingRow>(`UPDATE work_order_drawings SET scene_json=$4::jsonb,schema_version=1,entity_version=entity_version+1,updated_by_member_id=$5,updated_at=now() WHERE company_id=$1 AND id=$2::uuid AND entity_version=$3 RETURNING id,work_order_id,revision_id,schema_version,scene_json,entity_version,updated_at`, [scope.companyId, current.id, body.expectedVersion, serialized, scope.companyMemberId])).rows[0]
        : (await client.query<DrawingRow>(`INSERT INTO work_order_drawings(company_id,work_order_id,revision_id,slot_key,schema_version,scene_json,created_by_member_id,updated_by_member_id) VALUES($1,$2::uuid,$3::uuid,$4,1,$5::jsonb,$6,$6) RETURNING id,work_order_id,revision_id,schema_version,scene_json,entity_version,updated_at`, [scope.companyId, workOrderId, target.revision_id, DRAWING_SLOT_KEY, serialized, scope.companyMemberId])).rows[0];
      if (!saved) throw new Error("CONFLICT");
      await client.query(`INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version) VALUES($1,'work_order_drawing',$2,$3,$4,$5,'레시피 스케치 저장',$6::jsonb,1)`, [scope.companyId, saved.id, DRAWING_SAVE_COMMAND_CODE, scope.companyMemberId, correlationId, JSON.stringify({ workOrderId, revisionId: saved.revision_id, drawingId: saved.id, slotKey: DRAWING_SLOT_KEY, clientRequestId: body.clientRequestId, versionTransition: { from: body.expectedVersion, to: Number(saved.entity_version) } })]);
      await client.query(`UPDATE work_order_command_receipts SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_entity_version=$6 WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [scope.companyId, DRAWING_SAVE_COMMAND_CODE, scopedKey, workOrderId, saved.revision_id, Number(saved.entity_version)]);
      return { drawing: responseDrawing(saved), idempotentReplay: false };
    });
    return createWaflApiSuccess(result.drawing, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId, "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "INTERNAL";
    const entityVersion = typeof error === "object" && error !== null && "entityVersion" in error ? Number(error.entityVersion) : undefined;
    if (!new Set(["NOT_FOUND", "LOCKED", "CONFLICT", "IDEMPOTENCY_CONFLICT", "PAYLOAD_TOO_LARGE", "INVALID_BODY", "INVALID_SCENE"]).has(reason)) console.error("[WORK_ORDER_DRAWING_SAVE_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "Unknown" });
    return errorResponse(reason, correlationId, entityVersion);
  }
}
