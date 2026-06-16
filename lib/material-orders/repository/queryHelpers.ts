import type { MaterialOrderListParams } from "@/lib/material-orders/types";

export function buildMaterialOrderVisibilityPredicate(
  visibility: MaterialOrderListParams["visibility"],
  values: unknown[],
  columnSql = "orders.requested_by_user_id",
): string {
  if (visibility?.mode !== "assigned") return "";

  const accessibleOwnerIds = Array.from(new Set([visibility.userId, visibility.companyMemberId]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))));

  if (accessibleOwnerIds.length === 0) return "AND FALSE";
  values.push(accessibleOwnerIds);
  return `AND ${columnSql} = ANY($${values.length}::text[])`;
}

export function buildMaterialOrderWhere(params: MaterialOrderListParams): { sql: string; values: unknown[] } {
  const clauses = ["orders.company_id = $1"];
  const values: unknown[] = [params.companyId];
  const visibilityPredicate = buildMaterialOrderVisibilityPredicate(params.visibility, values);
  if (visibilityPredicate) clauses.push(visibilityPredicate.replace(/^AND\s+/, ""));
  if (params.status) {
    values.push(params.status);
    clauses.push(`orders.status = $${values.length}`);
  }
  return { sql: clauses.join(" AND "), values };
}

export const MATERIAL_ORDER_SELECT_SQL = `
  SELECT
    orders.id,
    orders.company_id,
    orders.supplier_partner_id,
    supplier.name AS supplier_partner_name,
    orders.material_type,
    orders.status,
    orders.workflow_path,
    orders.requested_by_user_id,
    COALESCE(
      NULLIF(requested_member.display_name, ''),
      NULLIF(requested_user.name, ''),
      NULLIF(requested_user.email, '')
    ) AS requested_by_display_name,
    orders.approved_by_user_id,
    orders.ordered_at,
    orders.due_date,
    orders.total_amount,
    orders.note,
    orders.created_at,
    orders.updated_at
  FROM material_orders orders
  LEFT JOIN partners supplier
    ON supplier.id = orders.supplier_partner_id
    AND supplier.company_id = orders.company_id
  LEFT JOIN users requested_user
    ON requested_user.id = orders.requested_by_user_id
  LEFT JOIN company_members requested_member
    ON requested_member.user_id = requested_user.id
    AND requested_member.company_id = orders.company_id
`;
