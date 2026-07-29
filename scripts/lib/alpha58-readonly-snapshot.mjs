import assert from "node:assert/strict";
import crypto from "node:crypto";

const SNAPSHOT_TABLES = Object.freeze({
  sizes: { table: "work_order_sizes", orderBy: "id" },
  colors: { table: "work_order_colors", orderBy: "id" },
  quantities: {
    table: "color_size_quantities",
    orderBy: "revision_id, color_id, size_id",
  },
  specs: { table: "work_order_size_specs", orderBy: "id" },
  specSizes: { table: "work_order_size_spec_sizes", orderBy: "id" },
  specPoms: { table: "work_order_size_spec_poms", orderBy: "id" },
  specValues: {
    table: "work_order_size_spec_values",
    orderBy: "size_spec_id, size_row_id, pom_column_id",
  },
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function snapshotSizeColorTables(client, workOrderId) {
  await client.query("BEGIN READ ONLY");
  try {
    const identity = (await client.query(`
      SELECT w.company_id, w.current_revision_id, w.entity_version AS work_order_version,
             r.entity_version AS revision_version
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE w.id=$1::uuid
    `, [workOrderId])).rows[0];
    assert.ok(identity, "TARGET_WORK_ORDER_NOT_FOUND");
    const other = (await client.query(`
      SELECT id
        FROM work_orders
       WHERE company_id<>$1 AND deleted_at IS NULL
       ORDER BY id
       LIMIT 1
    `, [identity.company_id])).rows[0] ?? null;
    const ledger = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM domain_events) AS event_count,
        (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
    `)).rows[0];
    const tableRows = {};
    for (const [key, { table, orderBy }] of Object.entries(SNAPSHOT_TABLES)) {
      tableRows[key] = (await client.query(
        `SELECT * FROM ${table} WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY ${orderBy}`,
        [identity.company_id, identity.current_revision_id],
      )).rows;
    }
    await client.query("COMMIT");
    return {
      companyId: identity.company_id,
      revisionId: identity.current_revision_id,
      workOrderVersion: Number(identity.work_order_version),
      revisionVersion: Number(identity.revision_version),
      events: Number(ledger.event_count),
      receipts: Number(ledger.receipt_count),
      migrations: Number(ledger.migration_count),
      tableCounts: Object.fromEntries(Object.entries(tableRows).map(([key, rows]) => [key, rows.length])),
      tableFingerprint: sha256(JSON.stringify(tableRows)),
      foreignWorkOrderId: other?.id ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
