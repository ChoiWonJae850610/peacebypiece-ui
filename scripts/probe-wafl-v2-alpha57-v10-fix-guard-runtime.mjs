#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(
  path.join(root, ".tmp", "wafl-external-qa", "state.json"),
  "utf8",
));
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-guard-runtime.json");

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    )) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function ref(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

assert.equal(state.status, "running");
assert.equal(state.runtimeQaMode, "work-order-image");
assert.equal(state.nextPort, 3100);
assert.equal(state.expoPort, 8081);
assert.equal(state.fingerprintVerified, true);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-fix-guard-runtime-probe",
});
await client.connect();
let target;
try {
  await client.query("BEGIN READ ONLY");
  target = (await client.query(`
    SELECT w.id AS target_id,
           (
             SELECT foreign_work_order.id
               FROM work_orders foreign_work_order
              WHERE foreign_work_order.company_id <> w.company_id
                AND foreign_work_order.deleted_at IS NULL
              ORDER BY foreign_work_order.id
              LIMIT 1
           ) AS foreign_id
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
     WHERE w.company_id = 'wafl-fn-company-a'
       AND w.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = 'UNITEDITABLEMATERI'
       )
     LIMIT 1
  `)).rows[0];
  assert.ok(target?.target_id && target?.foreign_id, "GUARD_PROBE_FIXTURES_MISSING");
  await client.query("ROLLBACK");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

const base = `https://${state.tailscaleServeHostname}`;
let cookie = "";
async function request(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method ?? "GET",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(options.withSession !== false && cookie ? { Cookie: cookie } : {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  return {
    status: response.status,
    code: body?.error?.code ?? body?.code ?? null,
    authenticated: body?.authenticated ?? null,
    session: body?.user ? {
      companyRef: ref(body.user.companyId),
      memberRef: ref(body.user.companyMemberId),
      role: body.user.role,
    } : null,
  };
}

const auto = await request("/api/dev/mobile-connect/auto", { method: "POST" });
assert.equal(auto.status, 200);
assert.ok(cookie);
const me = await request("/api/auth/me");
const list = await request("/api/v2/work-orders?limit=1");
const detail = await request(`/api/v2/work-orders/${encodeURIComponent(target.target_id)}`);
const foreign = await request(`/api/v2/work-orders/${encodeURIComponent(target.foreign_id)}`);
const anonymous = await request("/api/v2/work-orders?limit=1", { withSession: false });

assert.equal(me.status, 200);
assert.equal(me.authenticated, true);
assert.equal(me.session?.companyRef, ref("wafl-fn-company-a"));
assert.equal(me.session?.role, "company_admin");
assert.equal(list.status, 200);
assert.equal(detail.status, 200);
assert.equal(foreign.status, 404);
assert.equal(anonymous.status, 401);

const result = {
  ok: true,
  autoConnect: auto.status,
  session: me.session,
  listGet: list.status,
  targetDetailGet: detail.status,
  targetWorkOrderRef: ref(target.target_id),
  foreignWorkspaceDetail: { status: foreign.status, code: foreign.code },
  anonymousList: { status: anonymous.status, code: anonymous.code },
  guardDisabled: false,
  entitlementBypass: false,
  forcedStatusConversion: false,
};
fs.writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));
