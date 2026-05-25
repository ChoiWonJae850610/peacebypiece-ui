import type { DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import { buildSpecSheetReturningColumns } from "@/lib/workorder/repository/dbWorkOrderReturningColumns";

const SPEC_SHEET_TABLE = "spec_sheets";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function buildSpecSheetInsertMutationSql(
  schema: DbSpecSheetSchema,
  columns: string[],
  placeholders: string[],
): string {
  const returningColumns = buildSpecSheetReturningColumns(schema);

  return `
      INSERT INTO ${quoteIdentifier(SPEC_SHEET_TABLE)} (
        ${columns.map(quoteIdentifier).join(", ")}
      )
      VALUES (
        ${placeholders.join(", ")}
      )
      RETURNING
        ${returningColumns.join(",\n        ")}
    `;
}

export function buildSpecSheetUpdateMutationSql(
  schema: DbSpecSheetSchema,
  assignments: string[],
  companyId: string,
): string {
  const returningColumns = buildSpecSheetReturningColumns(schema);

  return `
      UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
      SET
        ${assignments.join(",\n        ")}
      WHERE id = $1
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteLiteral(companyId)}` : ""}
      RETURNING
        ${returningColumns.join(",\n        ")}
    `;
}

export function buildSpecSheetStatePatchMutationSql(
  schema: DbSpecSheetSchema,
  assignments: string[],
  companyId: string,
): string {
  return buildSpecSheetUpdateMutationSql(schema, assignments, companyId);
}
