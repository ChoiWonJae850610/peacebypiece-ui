import "server-only";

import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { validateDrawingScene, type DrawingSceneV1 } from "@/lib/domain/drawing";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";

const DRAWING_SLOT_KEY = "primary_sketch";

export async function loadWorkOrderPdfDrawingScene(
  tenantScope: TenantMemberScope,
  workOrderId: string,
  revisionId: string,
): Promise<DrawingSceneV1 | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope);
    const row = (await client.query<DbQueryResultRow & { readonly scene_json: unknown }>(`
      SELECT drawing.scene_json
      FROM work_order_drawings drawing
      JOIN work_order_revisions revision
        ON revision.company_id = drawing.company_id
       AND revision.work_order_id = drawing.work_order_id
       AND revision.id = drawing.revision_id
      WHERE drawing.company_id = $1
        AND drawing.work_order_id = $2::uuid
        AND drawing.revision_id = $3::uuid
        AND drawing.slot_key = $4
      LIMIT 1
    `, [tenantScope.companyId, workOrderId, revisionId, DRAWING_SLOT_KEY])).rows[0];
    if (!row) return null;
    const result = validateDrawingScene(row.scene_json);
    if (!result.ok) throw new Error("PDF_DRAWING_SCENE_INVALID");
    return result.scene;
  });
}
