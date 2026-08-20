import "server-only";

import { createHash, randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { getWorkOrderV2BasicInfoMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import type { CorrelationId, EntityVersion } from "@/lib/domain/work-orders/contracts";

const COMMAND_CODE = "work_order.set_sample";
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

type Body = { readonly clientRequestId?: unknown; readonly expectedVersion?: unknown; readonly isSample?: unknown };

export async function handleSetWorkOrderSampleV2(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2BasicInfoMutationRuntimeGuard().ok) {
    return createCommandErrorResponse({ code: "FORBIDDEN", message: "Sample 변경은 승인된 dev/test runtime에서만 사용할 수 있습니다.", status: 403, correlationId });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });

  try {
    const body = await readBoundedCommandJson(request) as Body;
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
    if (!ID_PATTERN.test(String(body.clientRequestId ?? "")) || !ID_PATTERN.test(idempotencyKey)
      || !Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 1
      || typeof body.isSample !== "boolean") {
      return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: "Sample 변경 요청을 확인해 주세요.", status: 400, correlationId });
    }
    const companyMemberId = guard.session.companyMemberId?.trim();
    if (!companyMemberId) return createCommandErrorResponse({ code: "FORBIDDEN", message: "회사 구성원 정보가 필요합니다.", status: 403, correlationId });
    const requestHash = createHash("sha256").update(JSON.stringify({ workOrderId, expectedVersion: body.expectedVersion, isSample: body.isSample })).digest("hex");
    const scopedKey = createHash("sha256").update(`${guard.scope.companyId}\0${COMMAND_CODE}\0${idempotencyKey}`).digest("hex");
    const result = await withWaflV2TenantWriteTransaction(async (client) => {
      await client.query(`SELECT set_config('wafl.company_id',$1,true), set_config('wafl.company_member_id',$2,true), set_config('wafl.access_mode','tenant_member',true), set_config('wafl.correlation_id',$3,true)`, [guard.scope.companyId, companyMemberId, correlationId]);
      const receipt = await client.query<DbQueryResultRow & { request_sha256: string; result_entity_version: number | string | null }>(`
        INSERT INTO work_order_command_receipts(company_id,command_code,idempotency_key,request_sha256,correlation_id)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(company_id,command_code,idempotency_key) DO NOTHING
        RETURNING request_sha256,result_entity_version
      `, [guard.scope.companyId, COMMAND_CODE, scopedKey, requestHash, correlationId]);
      if (receipt.rowCount === 0) {
        const previous = await client.query<DbQueryResultRow & { request_sha256: string; result_entity_version: number | string | null }>(`SELECT request_sha256,result_entity_version FROM work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [guard.scope.companyId, COMMAND_CODE, scopedKey]);
        const row = previous.rows[0];
        if (!row || row.request_sha256 !== requestHash || row.result_entity_version === null) throw new Error("IDEMPOTENCY_CONFLICT");
        return { nextVersion: Number(row.result_entity_version), idempotentReplay: true };
      }
      const updated = await client.query<DbQueryResultRow & { entity_version: number | string }>(`
        UPDATE work_orders SET is_sample=$4, entity_version=entity_version+1, updated_at=now()
        WHERE company_id=$1 AND id=$2::uuid AND entity_version=$3 AND deleted_at IS NULL
          AND (NOT $4::boolean OR (derivation_kind <> 'reorder' AND reorder_round = 0))
        RETURNING entity_version
      `, [guard.scope.companyId, workOrderId, body.expectedVersion, body.isSample]);
      if (!updated.rows[0]) {
        const current = await client.query<DbQueryResultRow & { entity_version: number | string; derivation_kind: string; reorder_round: number | string }>(`
          SELECT entity_version,derivation_kind,reorder_round FROM work_orders
          WHERE company_id=$1 AND id=$2::uuid AND deleted_at IS NULL
        `, [guard.scope.companyId, workOrderId]);
        const row = current.rows[0];
        if (body.isSample && row && (row.derivation_kind === "reorder" || Number(row.reorder_round) >= 1)) throw new Error("SAMPLE_REORDER_FORBIDDEN");
        throw new Error("VERSION_OR_NOT_FOUND");
      }
      const nextVersion = Number(updated.rows[0].entity_version) as EntityVersion;
      await client.query(`INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version) VALUES($1,'work_order',$2,$3,$4,$5,'WorkOrder 작업 구분 변경',$6::jsonb,1)`, [guard.scope.companyId, workOrderId, COMMAND_CODE, companyMemberId, correlationId, JSON.stringify({ clientRequestId: body.clientRequestId, changedFields: ["isSample"], versionTransition: { from: body.expectedVersion, to: nextVersion } })]);
      await client.query(`UPDATE work_order_command_receipts SET work_order_id=$4::uuid,result_entity_version=$5 WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3`, [guard.scope.companyId, COMMAND_CODE, scopedKey, workOrderId, nextVersion]);
      return { nextVersion, idempotentReplay: false };
    });
    return createWaflApiSuccess({ result: { workOrderId, isSample: body.isSample, nextVersion: result.nextVersion }, nextVersion: result.nextVersion }, { status: 200, headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId, "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "VERSION_OR_NOT_FOUND") return createCommandErrorResponse({ code: "CONFLICT", message: "최신 상태를 다시 확인해 주세요.", status: 409, correlationId });
    if (message === "SAMPLE_REORDER_FORBIDDEN") return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: "리오더 작업지시서는 본생산으로만 관리할 수 있습니다.", status: 409, correlationId });
    if (message === "IDEMPOTENCY_CONFLICT") return createCommandErrorResponse({ code: "CONFLICT", message: "같은 요청 식별값이 다른 변경에 사용되었습니다.", status: 409, correlationId });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "작업 구분을 변경하지 못했습니다.", status: 500, retryable: true, correlationId });
  }
}
