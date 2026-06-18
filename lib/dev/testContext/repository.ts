import "server-only";

import { queryDb } from "@/lib/db/client";
import type { DevTestContextOverlayRole } from "./session";

export type DevTestContextTarget = {
  targetKey: string;
  targetType: "company" | "system";
  userId: string;
  companyId: string | null;
  companyName: string | null;
  companyMemberId: string | null;
  role: DevTestContextOverlayRole;
  email: string;
  name: string;
  roleTemplateCode: string | null;
};

type CompanyTargetRow = {
  user_id: string; company_id: string; company_name: string; company_member_id: string;
  email: string | null; name: string; display_name: string | null; role_template_code: string | null;
};
type SystemTargetRow = { id: string; email: string; name: string };

function toSessionRole(code: string | null): DevTestContextOverlayRole {
  return code === "company_admin" ? "company_admin" : "member";
}
function mapCompany(row: CompanyTargetRow): DevTestContextTarget {
  return { targetKey: `company:${row.company_member_id}`, targetType: "company", userId: row.user_id,
    companyId: row.company_id, companyName: row.company_name, companyMemberId: row.company_member_id,
    role: toSessionRole(row.role_template_code), email: row.email ?? "", name: row.display_name ?? row.name,
    roleTemplateCode: row.role_template_code };
}
function mapSystem(row: SystemTargetRow): DevTestContextTarget {
  return { targetKey: `system:${row.id}`, targetType: "system", userId: row.id, companyId: null,
    companyName: null, companyMemberId: null, role: "system_admin", email: row.email, name: row.name,
    roleTemplateCode: "system_admin" };
}

const TEST_TARGET_WHERE = `
  (c.id IN ('test-company-a', 'test-company-b') OR c.id LIKE 'wafl-fn-company-%')
  AND c.is_active = true
  AND u.is_active = true
  AND cm.status = 'approved'
  AND COALESCE(cm.role_template_code, '') <> 'system_admin'
`;

async function listCompanyTargets(): Promise<DevTestContextTarget[]> {
  const result = await queryDb<CompanyTargetRow>(`
    SELECT u.id AS user_id, c.id AS company_id, c.name AS company_name, cm.id AS company_member_id,
           u.email, u.name, cm.display_name, cm.role_template_code
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
      JOIN companies c ON c.id = cm.company_id
     WHERE ${TEST_TARGET_WHERE}
     ORDER BY c.id, cm.display_name, u.name`);
  return result.rows.map(mapCompany);
}

async function listSystemTargets(): Promise<DevTestContextTarget[]> {
  const result = await queryDb<SystemTargetRow>(`
    SELECT id, email, name FROM system_users
     WHERE is_active = true AND role = 'system_admin'
     ORDER BY name, email`);
  return result.rows.map(mapSystem);
}

export async function listDevTestContextTargets(): Promise<DevTestContextTarget[]> {
  const [systemTargets, companyTargets] = await Promise.all([listSystemTargets(), listCompanyTargets()]);
  return [...systemTargets, ...companyTargets];
}

export async function getDevTestContextTargetByKey(targetKey: string): Promise<DevTestContextTarget | null> {
  const trimmed = targetKey.trim();
  if (trimmed.startsWith("system:")) {
    const id = trimmed.slice(7);
    const result = await queryDb<SystemTargetRow>(
      `SELECT id, email, name FROM system_users WHERE id = $1 AND is_active = true AND role = 'system_admin' LIMIT 1`, [id]);
    return result.rows[0] ? mapSystem(result.rows[0]) : null;
  }
  if (!trimmed.startsWith("company:")) return null;
  const id = trimmed.slice(8);
  const result = await queryDb<CompanyTargetRow>(`
    SELECT u.id AS user_id, c.id AS company_id, c.name AS company_name, cm.id AS company_member_id,
           u.email, u.name, cm.display_name, cm.role_template_code
      FROM company_members cm JOIN users u ON u.id = cm.user_id JOIN companies c ON c.id = cm.company_id
     WHERE ${TEST_TARGET_WHERE} AND cm.id = $1 LIMIT 1`, [id]);
  return result.rows[0] ? mapCompany(result.rows[0]) : null;
}
