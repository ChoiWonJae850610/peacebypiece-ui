import "server-only";

import { queryDb } from "@/lib/db/client";
import type { DevTestContextOverlayRole } from "./session";

export type DevTestContextTarget = {
  userId: string;
  companyId: string;
  companyName: string;
  companyMemberId: string;
  role: DevTestContextOverlayRole;
  email: string;
  name: string;
  roleTemplateCode: string | null;
};

type DevTestContextTargetRow = {
  user_id: string;
  company_id: string;
  company_name: string;
  company_member_id: string;
  email: string | null;
  name: string;
  display_name: string | null;
  role_template_code: string | null;
};

function toSessionRole(roleTemplateCode: string | null): DevTestContextOverlayRole {
  return roleTemplateCode === "company_admin" ? "company_admin" : "member";
}

function mapTargetRow(row: DevTestContextTargetRow): DevTestContextTarget {
  return {
    userId: row.user_id,
    companyId: row.company_id,
    companyName: row.company_name,
    companyMemberId: row.company_member_id,
    role: toSessionRole(row.role_template_code),
    email: row.email ?? "",
    name: row.display_name ?? row.name,
    roleTemplateCode: row.role_template_code,
  };
}

const TEST_TARGET_WHERE = `
  c.id IN ('test-company-a', 'test-company-b')
  AND c.is_active = true
  AND u.id LIKE 'test-%'
  AND u.is_active = true
  AND cm.id LIKE 'test-cm-%'
  AND cm.status = 'approved'
  AND COALESCE(cm.role_template_code, '') <> 'system_admin'
`;

export async function listDevTestContextTargets(): Promise<DevTestContextTarget[]> {
  const result = await queryDb<DevTestContextTargetRow>(
    `
      SELECT
        u.id AS user_id,
        c.id AS company_id,
        c.name AS company_name,
        cm.id AS company_member_id,
        u.email,
        u.name,
        cm.display_name,
        cm.role_template_code
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
      JOIN companies c ON c.id = cm.company_id
      WHERE ${TEST_TARGET_WHERE}
      ORDER BY c.id, CASE cm.role_template_code
        WHEN 'company_admin' THEN 10
        WHEN 'designer' THEN 20
        WHEN 'inspector' THEN 30
        WHEN 'inventory_manager' THEN 40
        WHEN 'viewer' THEN 50
        ELSE 90
      END, cm.display_name, u.name
    `,
  );

  return result.rows.map(mapTargetRow);
}

export async function getDevTestContextTargetByMemberId(companyMemberId: string): Promise<DevTestContextTarget | null> {
  const trimmed = companyMemberId.trim();
  if (!trimmed) return null;

  const result = await queryDb<DevTestContextTargetRow>(
    `
      SELECT
        u.id AS user_id,
        c.id AS company_id,
        c.name AS company_name,
        cm.id AS company_member_id,
        u.email,
        u.name,
        cm.display_name,
        cm.role_template_code
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
      JOIN companies c ON c.id = cm.company_id
      WHERE ${TEST_TARGET_WHERE}
        AND cm.id = $1
      LIMIT 1
    `,
    [trimmed],
  );

  return result.rows[0] ? mapTargetRow(result.rows[0]) : null;
}
