import "server-only";

import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { ADMIN_FILE_TRASH_ACTOR_IDS } from "@/lib/admin/files/trashPolicy";
import { queryDb } from "@/lib/db/client";
import { resolveWorkOrderCompanyId } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function buildSpecSheetCompanyScopePredicate(
  schema: DbSpecSheetSchema,
  scope?: WorkOrderCompanyScope | null,
): string {
  if (!schema.companyIdColumn) {
    return "";
  }

  return `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteLiteral(resolveWorkOrderCompanyId(scope))}`;
}

export function buildSoftDeleteSpecSheetAssignments(
  schema: DbSpecSheetSchema,
): string[] {
  if (!schema.isActiveColumn) {
    return [];
  }

  const assignments = [`${quoteIdentifier(schema.isActiveColumn)} = FALSE`];

  if (schema.deletedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.deletedAtColumn)} = NOW()`);
  }
  if (schema.deleteStatusColumn) {
    assignments.push(`${quoteIdentifier(schema.deleteStatusColumn)} = 'trashed'`);
  }
  if (schema.purgeStatusColumn) {
    assignments.push(`${quoteIdentifier(schema.purgeStatusColumn)} = 'pending'`);
  }
  if (schema.purgeRequestedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.purgeRequestedAtColumn)} = NULL`);
  }
  if (schema.purgeRequestedByColumn) {
    assignments.push(`${quoteIdentifier(schema.purgeRequestedByColumn)} = NULL`);
  }
  if (schema.deleteSourceColumn) {
    assignments.push(`${quoteIdentifier(schema.deleteSourceColumn)} = 'manual'`);
  }
  if (schema.deleteScopeColumn) {
    assignments.push(`${quoteIdentifier(schema.deleteScopeColumn)} = 'bundle'`);
  }
  if (schema.deleteParentTypeColumn) {
    assignments.push(`${quoteIdentifier(schema.deleteParentTypeColumn)} = 'workorder'`);
  }
  if (schema.deleteParentIdColumn) {
    assignments.push(`${quoteIdentifier(schema.deleteParentIdColumn)} = id`);
  }
  if (schema.deleteBatchIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.deleteBatchIdColumn)} = COALESCE(${quoteIdentifier(schema.deleteBatchIdColumn)}, id)`,
    );
  }
  if (schema.purgedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.purgedAtColumn)} = NULL`);
  }
  if (schema.purgedByColumn) {
    assignments.push(`${quoteIdentifier(schema.purgedByColumn)} = NULL`);
  }

  return assignments;
}

export async function softDeleteAttachmentMemoBundleForWorkOrder(
  workOrderId: string,
): Promise<void> {
  const trashRetentionDays = COMPANY_FILE_TRASH_RETENTION_DAYS;

  await queryDb(
    `WITH updated_attachments AS (
       UPDATE attachments
          SET is_active = false,
              deleted_at = COALESCE(deleted_at, now()),
              deleted_by = COALESCE(deleted_by, $3),
              delete_source = COALESCE(delete_source, 'workorder_bundle'),
              delete_scope = COALESCE(delete_scope, 'bundle'),
              delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
              delete_parent_id = COALESCE(delete_parent_id, $1),
              delete_batch_id = COALESCE(delete_batch_id, $1),
              purge_after_at = COALESCE(purge_after_at, now() + ($2::integer * interval '1 day')),
              updated_at = now()
        WHERE order_id = $1
          AND is_active = true
          AND deleted_at IS NULL
        RETURNING id,
                  company_id,
                  company_name,
                  order_id,
                  storage_key,
                  thumbnail_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  deleted_by,
                  delete_source,
                  delete_scope,
                  delete_parent_type,
                  delete_parent_id,
                  delete_batch_id,
                  deleted_at,
                  purge_after_at
     )
     INSERT INTO attachment_trash_items (
       company_id,
       company_name,
       attachment_id,
       order_id,
       storage_key,
       thumbnail_key,
       original_name,
       mime_type,
       size_bytes,
       deleted_by,
       delete_source,
       delete_scope,
       delete_parent_type,
       delete_parent_id,
       delete_batch_id,
       deleted_at,
       purge_after_at
     )
     SELECT company_id,
            company_name,
            id,
            order_id,
            storage_key,
            thumbnail_key,
            original_name,
            mime_type,
            COALESCE(size_bytes, 0),
            deleted_by,
            delete_source,
            delete_scope,
            delete_parent_type,
            delete_parent_id,
            delete_batch_id,
            COALESCE(deleted_at, now()),
            COALESCE(purge_after_at, now() + ($2::integer * interval '1 day'))
       FROM updated_attachments
     ON CONFLICT DO NOTHING`,
    [
      workOrderId,
      trashRetentionDays,
      ADMIN_FILE_TRASH_ACTOR_IDS.workorderDelete,
    ],
  );

  await queryDb(
    `UPDATE memos
        SET is_active = false,
            delete_status = 'trashed',
            purge_status = 'pending',
            purge_requested_at = NULL,
            purge_requested_by = NULL,
            delete_source = 'workorder_bundle',
            delete_scope = 'bundle',
            delete_parent_type = 'workorder',
            delete_parent_id = $1,
            delete_batch_id = COALESCE(delete_batch_id, $1),
            purged_at = NULL,
            purged_by = NULL,
            deleted_at = COALESCE(deleted_at, now()),
            updated_at = now()
      WHERE order_id = $1
        AND is_active = true
        AND deleted_at IS NULL`,
    [workOrderId],
  );
}
