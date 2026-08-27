import "server-only";

import { createHash } from "crypto";

import type { TenantMemberScope, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { ReorderAssetCopyPlan } from "@/lib/domain/work-orders/command/reorderCommandRepository";
import { createWorkOrderAttachmentStorageKey, createWorkOrderImageDerivativeKeys } from "@/lib/storage/r2/r2Keys";
import { createR2WorkerFileUrl, createR2WorkerUploadUrl, deleteR2ObjectViaWorker } from "@/lib/storage/r2/r2WorkerUpload";
import { ATTACHMENT_SCOPE } from "@/lib/constants/workorderIdentity";

type AssetRow = DbQueryResultRow & {
  readonly asset_type: "image" | "attachment";
  readonly id: string;
  readonly storage_object_key: string;
  readonly thumbnail_object_key: string | null;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly output_include: boolean;
  readonly is_representative: boolean;
};

function deterministicUuid(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

async function copyObject(sourceKey: string, targetKey: string, fallbackContentType: string) {
  const sourceRequest = createR2WorkerFileUrl({ key: sourceKey });
  const source = await fetch(sourceRequest.url, { method: sourceRequest.method, signal: AbortSignal.timeout(60_000) });
  if (!source.ok) throw new Error(`REORDER_ASSET_READ_FAILED_${source.status}`);
  const contentType = source.headers.get("content-type") || fallbackContentType;
  const targetRequest = createR2WorkerUploadUrl({ key: targetKey, contentType });
  const uploaded = await fetch(targetRequest.url, {
    method: targetRequest.method,
    headers: targetRequest.headers,
    body: await source.arrayBuffer(),
    signal: AbortSignal.timeout(60_000),
  });
  if (!uploaded.ok) throw new Error(`REORDER_ASSET_COPY_FAILED_${uploaded.status}`);
}

export async function prepareReorderAssetCopy(input: {
  readonly scope: TenantMemberScope;
  readonly sourceWorkOrderId: WorkOrderId;
  readonly targetWorkOrderId: WorkOrderId;
  readonly idempotencySeed: string;
  readonly includeAllAttachments?: boolean;
}): Promise<{ readonly plan: ReorderAssetCopyPlan; readonly copiedKeys: readonly string[] }> {
  const rows = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const result = await client.query<AssetRow>(`
      WITH source AS (
        SELECT id,current_revision_id,representative_image_id
        FROM work_orders
        WHERE company_id=$1 AND id=$2::uuid AND deleted_at IS NULL
      )
      SELECT 'image'::text AS asset_type,i.id,i.storage_object_key,i.thumbnail_object_key,
             i.original_filename,i.mime_type,true AS output_include,ri.is_representative
      FROM source s
      JOIN work_order_revision_images ri ON ri.company_id=$1 AND ri.revision_id=s.current_revision_id
        AND ($3::boolean OR (ri.image_id=s.representative_image_id AND ri.is_representative=true))
      JOIN work_order_images i ON i.company_id=$1 AND i.id=ri.image_id AND i.deleted_at IS NULL
      UNION ALL
      SELECT 'attachment'::text,a.id,a.storage_object_key,NULL::text,a.original_filename,a.mime_type,ra.output_include,false
      FROM source s
      JOIN work_order_revision_attachments ra ON ra.company_id=$1 AND ra.revision_id=s.current_revision_id AND ($3::boolean OR ra.output_include=true)
      JOIN work_order_attachments a ON a.company_id=$1 AND a.id=ra.attachment_id AND a.deleted_at IS NULL
      ORDER BY asset_type,id
    `, [input.scope.companyId, input.sourceWorkOrderId, input.includeAllAttachments === true]);
    return result.rows;
  });

  const copiedKeys: string[] = [];
  let image: ReorderAssetCopyPlan["image"] = null;
  const images: ReorderAssetCopyPlan["images"][number][] = [];
  const attachments: ReorderAssetCopyPlan["attachments"][number][] = [];
  try {
    for (const row of rows) {
      const targetId = deterministicUuid(`${input.idempotencySeed}:${row.asset_type}:${row.id}`);
      const scope = row.asset_type === "image" ? ATTACHMENT_SCOPE.design : ATTACHMENT_SCOPE.attachment;
      const targetKey = createWorkOrderAttachmentStorageKey({
        companyId: input.scope.companyId,
        workOrderId: input.targetWorkOrderId,
        scope,
        originalName: row.original_filename,
        objectId: targetId,
      });
      await copyObject(row.storage_object_key, targetKey, row.mime_type);
      copiedKeys.push(targetKey);
      if (row.asset_type === "image") {
        let targetThumbnailKey: string | null = null;
        if (row.thumbnail_object_key) {
          const sourceDerivatives = createWorkOrderImageDerivativeKeys(row.storage_object_key);
          const targetDerivatives = createWorkOrderImageDerivativeKeys(targetKey);
          for (const key of ["thumbnail", "medium", "large"] as const) {
            await copyObject(sourceDerivatives[key], targetDerivatives[key], "image/webp");
            copiedKeys.push(targetDerivatives[key]);
          }
          targetThumbnailKey = targetDerivatives.thumbnail;
        }
        const copiedImage = {
          sourceImageId: row.id,
          targetImageId: targetId,
          storageObjectKey: targetKey,
          thumbnailObjectKey: targetThumbnailKey,
          isRepresentative: row.is_representative,
        };
        images.push(copiedImage);
        if (row.is_representative) image = copiedImage;
      } else {
        attachments.push({ sourceAttachmentId: row.id, targetAttachmentId: targetId, storageObjectKey: targetKey, outputInclude: row.output_include });
      }
    }
    return { plan: { image, images, attachments }, copiedKeys };
  } catch (error) {
    for (const key of copiedKeys.reverse()) await deleteR2ObjectViaWorker({ key }).catch(() => undefined);
    throw error;
  }
}

export async function cleanupReorderAssetCopy(keys: readonly string[]) {
  for (const key of [...keys].reverse()) await deleteR2ObjectViaWorker({ key }).catch(() => undefined);
}

export function createReorderDeterministicId(seed: string, kind: string): string {
  return deterministicUuid(`${seed}:${kind}`);
}
