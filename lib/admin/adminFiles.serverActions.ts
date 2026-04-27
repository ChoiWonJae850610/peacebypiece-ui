import "server-only";

import { queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";

export type AdminTrashDbActionInput = {
  trashItemIds: string[];
  actorId?: string | null;
};

export type AdminTrashDbActionResult = {
  requestedCount: number;
  affectedCount: number;
};

type CountRow = DbQueryResultRow & {
  affected_count: string | number;
};

function normalizeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function readCount(row: CountRow | undefined): number {
  if (!row) return 0;
  const value = row.affected_count;
  return typeof value === "number" ? value : Number(value ?? 0);
}

export async function restoreAttachmentTrashItems(input: AdminTrashDbActionInput): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE id = ANY($1::text[])
          AND purge_status = 'pending'
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), restored_attachments AS (
       UPDATE attachments
          SET is_active = true,
              deleted_at = NULL,
              deleted_by = NULL,
              delete_reason = NULL,
              purge_after_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), restored_trash AS (
       UPDATE attachment_trash_items
          SET restored_at = now(),
              restored_by = $2,
              purge_status = 'restored',
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM restored_trash`,
    [trashItemIds, input.actorId ?? null],
  );

  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}

export async function requestPurgeAttachmentTrashItems(input: AdminTrashDbActionInput): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE id = ANY($1::text[])
          AND purge_status = 'pending'
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purge_status = 'purge_requested',
              purged_at = COALESCE(purged_at, now()),
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM marked_trash`,
    [trashItemIds],
  );

  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}
