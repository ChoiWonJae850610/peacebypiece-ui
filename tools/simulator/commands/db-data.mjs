#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SIMULATOR_DB_MANIFEST } from "../adapters/db/manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixture = JSON.parse(fs.readFileSync(path.join(root, SIMULATOR_DB_MANIFEST.fixtureSource), "utf8"));
const args = new Set(process.argv.slice(2));
const command = args.has("cleanup") ? "cleanup" : "seed";
const execute = args.has("--execute");
const runtime = String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "").trim().toLowerCase();
const reportPath = path.join(root, `artifacts/test-reports/functions/simulator-db-${command}-latest.json`);
const databaseKeys = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL"];
const databaseEntry = databaseKeys.map((key) => [key, process.env[key]]).find(([, value]) => typeof value === "string" && value.trim());
const allowedRuntime = new Set(fixture.runtime);
const TEST_PREFIX = fixture.idPrefix;

function databaseIdentity(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const database = url.pathname.replace(/^\//, "") || "unknown";
    const fingerprint = crypto.createHash("sha256").update(`${host}/${database}`).digest("hex").slice(0, 12);
    return { protocol: url.protocol, host, database, fingerprint };
  } catch {
    return null;
  }
}

function approvedDatabaseFingerprint(identity) {
  if (!identity) return false;
  const approved = String(process.env.WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  return approved.length > 0 && approved === identity.fingerprint.toLowerCase();
}

function mapPlan(plan) {
  if (plan === "trial") return "trial";
  if (plan === "basic") return "lite";
  if (plan === "pro") return "flow";
  return "custom";
}
function mapOnboarding(status) {
  if (status === "pending") return "approval_pending";
  if (status === "file-rejected") return "rejected";
  return "active";
}
function mapSubscription(status, billing) {
  if (status === "suspended") return "suspended";
  if (billing === "past-due") return "past_due";
  if (billing === "trial") return "trialing";
  return "active";
}
function roleFor(index) {
  if (index === 0) return "admin";
  return ["designer", "inventory_manager", "inspector", "viewer"][(index - 1) % 4];
}
function workorderStatus(index) {
  return ["draft", "review_requested", "review_completed", "material_order_pending", "inspection", "completed"][index % 6];
}
function materialOrderStatus(index) {
  return ["draft", "review_requested", "approved", "order_placed", "cancelled"][index % 5];
}
function buildPlan() {
  return fixture.companies.map((company) => ({
    companyId: company.id,
    companyName: `[SIM] ${company.code} ${company.name}`,
    planCode: mapPlan(company.plan),
    onboardingStatus: mapOnboarding(company.status),
    subscriptionStatus: mapSubscription(company.status, company.billing),
    rows: {
      companies: 1,
      subscriptions: 1,
      users: company.members,
      companyUsers: company.members,
      companyMembers: company.members,
      partners: company.partners,
      workorders: company.workorders,
      materialOrders: company.materialOrders,
      materialOrderLines: company.materialOrders,
      allocations: company.workorders > 0 ? company.materialOrders : 0,
      storageSnapshots: 1,
    },
    storage: company.storage,
  }));
}
function totals(plan) {
  return plan.reduce((sum, row) => {
    for (const [key, value] of Object.entries(row.rows)) sum[key] = (sum[key] ?? 0) + value;
    return sum;
  }, {});
}
function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
function assertExecutionSafety(identity) {
  if (!allowedRuntime.has(runtime) || runtime === "production") throw new Error(`실행 차단: runtime=${runtime || "unset"}`);
  if (!databaseEntry || !identity) throw new Error("실행 차단: PostgreSQL DB 환경변수가 없습니다.");
  if (!['postgres:', 'postgresql:'].includes(identity.protocol)) throw new Error("실행 차단: PostgreSQL URL이 아닙니다.");
  if (!approvedDatabaseFingerprint(identity)) throw new Error(`실행 차단: 승인된 Simulator DB fingerprint와 일치하지 않습니다. current=${identity.fingerprint}`);
  if (String(process.env.WAFL_FUNCTIONS_TEST_PREFIX ?? TEST_PREFIX) !== TEST_PREFIX) throw new Error("실행 차단: 테스트 prefix가 wafl-fn과 다릅니다.");
  if (String(process.env.WAFL_SIMULATOR_ENABLE_DB_MUTATION ?? "") !== "1") throw new Error("실행 차단: WAFL_SIMULATOR_ENABLE_DB_MUTATION=1 설정이 필요합니다.");
  const expected = command === "seed" ? "SEED WAF-FN" : "CLEANUP WAF-FN";
  if (String(process.env.WAFL_SIMULATOR_CONFIRM ?? "") !== expected) throw new Error(`실행 차단: WAFL_SIMULATOR_CONFIRM=${expected} 설정이 필요합니다.`);
}

async function seed(client, plan) {
  for (const row of plan) {
    const source = fixture.companies.find((company) => company.id === row.companyId);
    const ownerId = `${row.companyId}-user-001`;
    await client.query(
      `INSERT INTO companies (id,name,is_active,onboarding_status,owner_user_id,requested_plan_code,storage_limit_bytes,member_limit,billing_status,subscription_status,trial_started_at,trial_ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now()+interval '30 days')
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,is_active=EXCLUDED.is_active,onboarding_status=EXCLUDED.onboarding_status,owner_user_id=EXCLUDED.owner_user_id,requested_plan_code=EXCLUDED.requested_plan_code,storage_limit_bytes=EXCLUDED.storage_limit_bytes,member_limit=EXCLUDED.member_limit,billing_status=EXCLUDED.billing_status,subscription_status=EXCLUDED.subscription_status,updated_at=now()`,
      [row.companyId, row.companyName, source.status !== "suspended", row.onboardingStatus, ownerId, row.planCode, source.storage.quotaBytes, source.memberLimit, source.billing, row.subscriptionStatus],
    );
    await client.query(
      `INSERT INTO company_subscriptions (id,company_id,plan_code,status,trial_started_at,trial_ends_at,storage_limit_bytes,member_limit)
       VALUES ($1,$2,$3,$4,now(),now()+interval '30 days',$5,$6)
       ON CONFLICT (id) DO UPDATE SET plan_code=EXCLUDED.plan_code,status=EXCLUDED.status,storage_limit_bytes=EXCLUDED.storage_limit_bytes,member_limit=EXCLUDED.member_limit,updated_at=now()`,
      [`${row.companyId}-subscription`, row.companyId, row.planCode, row.subscriptionStatus, source.storage.quotaBytes, source.memberLimit],
    );

    for (let i = 0; i < source.members; i += 1) {
      const index = String(i + 1).padStart(3, "0");
      const userId = `${row.companyId}-user-${index}`;
      const role = roleFor(i);
      await client.query(
        `INSERT INTO users (id,company_id,email,name,role,is_active)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,role=EXCLUDED.role,is_active=EXCLUDED.is_active,updated_at=now()`,
        [userId, row.companyId, `${row.companyId}.${index}@example.test`, `[SIM] ${source.code} 사용자 ${index}`, role, source.status !== "suspended"],
      );
      await client.query(
        `INSERT INTO company_users (id,company_id,user_id,role,is_active,display_name,joined_at)
         VALUES ($1,$2,$3,$4,$5,$6,now())
         ON CONFLICT (company_id,user_id,role) DO UPDATE SET is_active=EXCLUDED.is_active,display_name=EXCLUDED.display_name,updated_at=now()`,
        [`${row.companyId}-membership-${index}`, row.companyId, userId, role, source.status !== "suspended", `[SIM] ${source.code} 사용자 ${index}`],
      );
      await client.query(
        `INSERT INTO company_members (id,company_id,user_id,status,role_template_code,display_name,approved_by,approved_at,suspended_by,suspended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,now(),$8,CASE WHEN $4::text = 'suspended' THEN now() ELSE NULL END)
         ON CONFLICT (company_id,user_id) DO UPDATE SET status=EXCLUDED.status,role_template_code=EXCLUDED.role_template_code,display_name=EXCLUDED.display_name,approved_by=EXCLUDED.approved_by,approved_at=EXCLUDED.approved_at,suspended_by=EXCLUDED.suspended_by,suspended_at=EXCLUDED.suspended_at,updated_at=now()`,
        [`${row.companyId}-member-${index}`, row.companyId, userId, source.status !== "suspended" ? "approved" : "suspended", role === "admin" ? "company_admin" : role, `[SIM] ${source.code} 사용자 ${index}`, ownerId, source.status === "suspended" ? ownerId : null],
      );
    }

    for (let i = 0; i < source.partners; i += 1) {
      const index = String(i + 1).padStart(4, "0");
      await client.query(
        `INSERT INTO partners (id,company_id,company_name,name,contact_person,contact,email,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,contact_person=EXCLUDED.contact_person,contact=EXCLUDED.contact,email=EXCLUDED.email,is_active=true,updated_at=now()`,
        [`${row.companyId}-partner-${index}`, row.companyId, row.companyName, `[SIM] 거래처 ${index}`, `담당 ${index}`, `010-0000-${String(i + 1).padStart(4, "0")}`, `${row.companyId}.partner.${index}@example.test`],
      );
    }

    for (let i = 0; i < source.workorders; i += 1) {
      const index = String(i + 1).padStart(5, "0");
      await client.query(
        `INSERT INTO spec_sheets (id,company_id,company_name,title,status,workflow_path,display_title,manager,manager_id,created_by_id,created_by_role,due_date,quantity)
         VALUES ($1,$2,$3,$4,$5,'standard_review',$4,$6,$7,$7,'admin',$8,$9)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,status=EXCLUDED.status,display_title=EXCLUDED.display_title,manager=EXCLUDED.manager,manager_id=EXCLUDED.manager_id,due_date=EXCLUDED.due_date,quantity=EXCLUDED.quantity,updated_at=now()`,
        [`${row.companyId}-workorder-${index}`, row.companyId, row.companyName, `[SIM] 작업지시서 ${index}`, workorderStatus(i), `[SIM] ${source.code} 관리자`, ownerId, i % 4 === 0 ? null : `2026-12-${String((i % 28) + 1).padStart(2, "0")}`, (i % 100) + 1],
      );
    }

    for (let i = 0; i < source.materialOrders; i += 1) {
      const index = String(i + 1).padStart(5, "0");
      const orderId = `${row.companyId}-material-order-${index}`;
      const lineId = `${row.companyId}-material-line-${index}`;
      const itemType = i % 2 === 0 ? "fabric" : "submaterial";
      const partnerId = source.partners > 0 ? `${row.companyId}-partner-${String((i % source.partners) + 1).padStart(4, "0")}` : null;
      await client.query(
        `INSERT INTO material_orders (id,company_id,supplier_partner_id,material_type,status,workflow_path,requested_by_user_id,due_date,total_amount,note)
         VALUES ($1,$2,$3,$4,$5,'standard_review',$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET supplier_partner_id=EXCLUDED.supplier_partner_id,material_type=EXCLUDED.material_type,status=EXCLUDED.status,requested_by_user_id=EXCLUDED.requested_by_user_id,due_date=EXCLUDED.due_date,total_amount=EXCLUDED.total_amount,note=EXCLUDED.note,updated_at=now()`,
        [orderId, row.companyId, partnerId, itemType, materialOrderStatus(i), ownerId, i % 3 === 0 ? null : `2026-11-${String((i % 28) + 1).padStart(2, "0")}`, (i + 1) * 1000, "[SIM] 테스트 발주서"],
      );
      await client.query(
        `INSERT INTO material_order_lines (id,company_id,material_order_id,item_name,item_type,color,spec,unit,order_quantity,unit_price,amount,note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET item_name=EXCLUDED.item_name,item_type=EXCLUDED.item_type,color=EXCLUDED.color,spec=EXCLUDED.spec,unit=EXCLUDED.unit,order_quantity=EXCLUDED.order_quantity,unit_price=EXCLUDED.unit_price,amount=EXCLUDED.amount,note=EXCLUDED.note,updated_at=now()`,
        [lineId, row.companyId, orderId, `[SIM] ${itemType === "fabric" ? "원단" : "부자재"} ${index}`, itemType, i % 2 === 0 ? "Black" : "Natural", "테스트 규격", itemType === "fabric" ? "yd" : "ea", (i % 20) + 1, 1000, ((i % 20) + 1) * 1000, "[SIM] 테스트 품목"],
      );
      if (source.workorders > 0) {
        const workorderIndex = String((i % source.workorders) + 1).padStart(5, "0");
        await client.query(
          `INSERT INTO material_order_allocations (id,company_id,material_order_line_id,work_order_id,source_material_key,allocated_quantity,allocation_note)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO UPDATE SET allocated_quantity=EXCLUDED.allocated_quantity,allocation_note=EXCLUDED.allocation_note,updated_at=now()`,
          [`${row.companyId}-allocation-${index}`, row.companyId, lineId, `${row.companyId}-workorder-${workorderIndex}`, `${TEST_PREFIX}:${itemType}:${index}`, (i % 20) + 1, "[SIM] 작업지시서 연결"],
        );
      }
    }

    await client.query(`DELETE FROM storage_usage_snapshots WHERE company_id=$1 AND source='manual' AND memo LIKE '[SIM]%'`, [row.companyId]);
    await client.query(
      `INSERT INTO storage_usage_snapshots (company_id,used_bytes,attachment_count,source,memo)
       VALUES ($1,$2,$3,'manual',$4)`,
      [row.companyId, source.storage.usedBytes, source.files, `[SIM] ${source.storage.expectedPercent}% fixture; R2 object reconciliation pending`],
    );
  }
}

async function cleanup(client) {
  const ids = fixture.companies.map((company) => company.id);
  const result = await client.query(`DELETE FROM companies WHERE id = ANY($1::text[]) AND id LIKE $2`, [ids, `${TEST_PREFIX}%`]);
  return result.rowCount ?? 0;
}

const plan = buildPlan();
const identity = databaseIdentity(databaseEntry?.[1]);
const report = {
  generatedAt: new Date().toISOString(),
  command,
  mode: execute ? "execute" : "dry-run",
  runtime: runtime || "unset",
  prefix: TEST_PREFIX,
  database: identity ? { envKey: databaseEntry[0], host: identity.host, database: identity.database, fingerprint: identity.fingerprint, approvedTarget: approvedDatabaseFingerprint(identity) } : null,
  totals: totals(plan),
  companies: plan,
  executed: false,
  note: execute ? "실제 DB transaction 실행 요청" : "계획만 출력하며 DB에 접속하지 않습니다.",
};

console.log(`Simulator DB ${command} ${execute ? "EXECUTE" : "DRY-RUN"}`);
console.log(`runtime=${runtime || "unset"} prefix=${TEST_PREFIX}`);
console.log(`database=${identity ? `${identity.host}/${identity.database} fingerprint=${identity.fingerprint} approvedTarget=${approvedDatabaseFingerprint(identity)}` : "unset"}`);
console.log(`companies=${plan.length} totals=${JSON.stringify(report.totals)}`);
for (const row of plan) console.log(JSON.stringify({ companyId: row.companyId, rows: row.rows, storagePercent: row.storage.expectedPercent }));

if (!execute) {
  writeReport(report);
  console.log("No database or R2 changes were executed.");
  console.log(`report=${path.relative(root, reportPath).replaceAll(path.sep, "/")}`);
} else {
  try {
    assertExecutionSafety(identity);
    const pg = await import("pg");
    const Pool = pg.default?.Pool ?? pg.Pool;
    const pool = new Pool({ connectionString: databaseEntry[1], max: 1 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${TEST_PREFIX}:simulator-db`]);
      const dbName = (await client.query("SELECT current_database() AS name")).rows[0]?.name ?? "unknown";
      if (dbName !== identity.database) throw new Error(`DB 이름 검증 실패: url=${identity.database} actual=${dbName}`);
      if (command === "seed") await seed(client, plan);
      else report.deletedCompanies = await cleanup(client);
      await client.query("COMMIT");
      report.executed = true;
      report.completedAt = new Date().toISOString();
      writeReport(report);
      console.log(`[SUCCESS] Simulator DB ${command} completed.`);
      console.log(`report=${path.relative(root, reportPath).replaceAll(path.sep, "/")}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error);
    writeReport(report);
    console.error(`[BLOCKED] ${report.error}`);
    process.exitCode = 1;
  }
}
