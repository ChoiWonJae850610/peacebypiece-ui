#!/usr/bin/env node
import crypto from "node:crypto";
import process from "node:process";

import pg from "pg";

const { Client } = pg;
const COMPANY_A = "wafl-fn-company-a";

function fail(code) { throw new Error(code); }
function sha256(value) { return crypto.createHash("sha256").update(value, "utf8").digest("hex"); }

function guard() {
  const connectionString = process.env.DATABASE_URL?.trim();
  const login = process.env.WAFL_ALPHA47_TAILSCALE_LOGIN?.trim().toLowerCase();
  const approvedFingerprint = process.env.WAFL_ALPHA47_APPROVED_DB_FINGERPRINT?.trim().toLowerCase();
  if (!connectionString || !login || !login.includes("@")) fail("ALPHA47_MAPPING_INPUT_MISSING");
  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!url.hostname || !databaseName || !new Set(["postgres:", "postgresql:"]).has(url.protocol)) fail("DATABASE_URL_INVALID");
  const fingerprint = sha256(`${url.hostname}/${databaseName}`).slice(0, 12);
  if (!approvedFingerprint || fingerprint !== approvedFingerprint) fail("DB_FINGERPRINT_MISMATCH");
  if (process.env.WAFL_ALPHA47_RUNTIME !== "dev" || process.env.WAFL_ALPHA47_TEST_PREFIX !== "wafl-fn") fail("DEV_TEST_RUNTIME_REQUIRED");
  return { connectionString, login };
}

const input = guard();
const client = new Client({ connectionString: input.connectionString, application_name: "wafl-alpha47-developer-mapping" });
await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const administrators = await client.query(`
    SELECT email
      FROM system_users
     WHERE role = 'system_admin' AND is_active = true
     ORDER BY id
     LIMIT 2
  `);
  const targets = await client.query(`
    SELECT u.id AS user_id, c.id AS company_id, c.name AS company_name,
           cm.id AS company_member_id, u.email, COALESCE(cm.display_name, u.name) AS name,
           cm.role_template_code,
           COALESCE((SELECT array_agg(mp.permission_code ORDER BY mp.permission_code)
                       FROM member_permissions mp
                      WHERE mp.company_member_id = cm.id AND mp.is_enabled = true), ARRAY[]::text[]) AS permission_codes
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id AND u.is_active = true
      JOIN companies c ON c.id = cm.company_id AND c.is_active = true
     WHERE c.id = $1 AND cm.status = 'approved' AND cm.role_template_code = 'company_admin'
     ORDER BY cm.id
     LIMIT 2
  `, [COMPANY_A]);
  await client.query("COMMIT");

  if (administrators.rows.length !== 1) fail("ACTIVE_SYSTEM_ADMIN_COUNT_MUST_BE_ONE");
  if (targets.rows.length !== 1) fail("COMPANY_A_ADMIN_TARGET_COUNT_MUST_BE_ONE");
  const target = targets.rows[0];
  if (!target.company_id || !target.company_member_id || !target.user_id || target.role_template_code !== "company_admin") {
    fail("COMPANY_A_ADMIN_TARGET_INVALID");
  }

  process.stdout.write(JSON.stringify({
    ok: true,
    tailscaleLoginSha256: sha256(input.login),
    systemAdminEmailSha256: sha256(String(administrators.rows[0].email).trim().toLowerCase()),
    activeSystemAdminCount: 1,
    companyATargetCount: 1,
    workorderRead: true,
  }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
