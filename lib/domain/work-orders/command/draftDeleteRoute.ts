import "server-only";
import { randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, mapCommandGuardFailureStatus } from "@/lib/domain/work-orders/command/commandRoute";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import { createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { deleteR2ObjectViaWorker, deleteWorkOrderImageFamilyViaWorker } from "@/lib/storage/r2/r2WorkerUpload";

export const WORK_ORDER_REORDER_DELETED_EVENT_CODE = "work_order.reorder_deleted";

export async function handleDeleteDraftWorkOrder(_request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard().ok) return createCommandErrorResponse({ code: "FORBIDDEN", message: "승인된 dev/test Runtime에서만 초안을 삭제할 수 있습니다.", status: 403, correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.delete" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  if (!/^[0-9a-f-]{36}$/i.test(workOrderId)) return createCommandErrorResponse({ code: "NOT_FOUND", message: "삭제할 초안을 찾을 수 없습니다.", status: 404, correlationId });
  const scope = createCommandTenantScope({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, permissionCode: "workorder.delete" });
  try {
    const assets = await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, scope);
      const target = (await client.query<DbQueryResultRow & {
        readonly revision_id: string;
        readonly status: string;
        readonly revision_status: string;
        readonly derivation_kind: string;
        readonly series_root_work_order_id: string | null;
        readonly reorder_round: number | string;
      }>(`
        SELECT w.current_revision_id revision_id,w.status,r.revision_status,
               w.derivation_kind,w.series_root_work_order_id,w.reorder_round
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
        WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL
        FOR UPDATE OF w,r
      `, [scope.companyId, workOrderId])).rows[0];
      if (!target) throw new Error("NOT_FOUND");
      if (target.status !== "draft" || target.revision_status !== "draft") throw new Error("LOCKED");
      const documents = await client.query(`SELECT 1 FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid LIMIT 1`, [scope.companyId, workOrderId]);
      if (documents.rows[0]) throw new Error("LOCKED");
      const imageRows = await client.query<DbQueryResultRow & { readonly storage_object_key: string }>(`SELECT storage_object_key FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid`, [scope.companyId, workOrderId]);
      const attachmentRows = await client.query<DbQueryResultRow & { readonly storage_object_key: string }>(`SELECT storage_object_key FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$2::uuid`, [scope.companyId, workOrderId]);

      if (target.derivation_kind === "reorder" && Number(target.reorder_round) > 0 && target.series_root_work_order_id) {
        await client.query(`
          INSERT INTO domain_events(company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
          SELECT $1,'work_order',$2::text,$3,$4,$5,'삭제된 리오더 계보 보존',
                 jsonb_build_object('seriesRootWorkOrderId',$6::text,'reorderRound',$7::integer,'state','deleted'),1
          WHERE NOT EXISTS (
            SELECT 1 FROM domain_events WHERE company_id=$1 AND command_code=$3 AND entity_id=$2::text
          )
        `, [scope.companyId, workOrderId, WORK_ORDER_REORDER_DELETED_EVENT_CODE, scope.companyMemberId, scope.correlationId, target.series_root_work_order_id, Number(target.reorder_round)]);
      }

      await client.query(`DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_size_specs WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_processes WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_revision_images WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_revision_attachments WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`UPDATE work_orders SET current_revision_id=NULL,representative_image_id=NULL WHERE company_id=$1 AND id=$2::uuid`, [scope.companyId, workOrderId]);
      await client.query(`DELETE FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid`, [scope.companyId, workOrderId]);
      await client.query(`DELETE FROM work_order_attachments WHERE company_id=$1 AND work_order_id=$2::uuid`, [scope.companyId, workOrderId]);
      await client.query(`DELETE FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid`, [scope.companyId, workOrderId]);
      await client.query(`DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid`, [scope.companyId, target.revision_id]);
      await client.query(`DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid`, [scope.companyId, workOrderId]);
      return { images: imageRows.rows.map((row) => row.storage_object_key), attachments: attachmentRows.rows.map((row) => row.storage_object_key) };
    });
    for (const key of assets.images) await deleteWorkOrderImageFamilyViaWorker({ storageObjectKey: key });
    for (const key of assets.attachments) await deleteR2ObjectViaWorker({ key });
    return createWaflApiSuccess({ deleted: true, workOrderId }, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "INTERNAL";
    if (reason === "NOT_FOUND") return createCommandErrorResponse({ code: "NOT_FOUND", message: "삭제할 초안을 찾을 수 없습니다.", status: 404, correlationId });
    if (reason === "LOCKED") return createCommandErrorResponse({ code: "LOCKED", message: "초안 작업지시서만 삭제할 수 있습니다.", status: 409, correlationId });
    console.error("[DRAFT_WORK_ORDER_DELETE_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "Unknown" });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "초안을 삭제하지 못했습니다.", status: 500, retryable: true, correlationId });
  }
}
