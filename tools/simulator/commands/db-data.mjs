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

const PARTNER_FIXTURE_TYPES = [
  { itemType: "factory", label: "봉제 공장", process: null, unit: "ea" },
  { itemType: "fabric", label: "원단 업체", process: null, unit: "yd" },
  { itemType: "subsidiary", label: "부자재 업체", process: null, unit: "ea" },
  { itemType: "outsourcing", label: "나염 업체", process: "나염", unit: "ea" },
  { itemType: "outsourcing", label: "자수 업체", process: "자수", unit: "ea" },
  { itemType: "outsourcing", label: "워싱 업체", process: "워싱", unit: "ea" },
  { itemType: "outsourcing", label: "검수 업체", process: "검수", unit: "ea" },
];

const PRODUCT_CATEGORY_FIXTURES = [
  ["상의", "맨투맨", "기본 맨투맨"], ["상의", "맨투맨", "오버핏 맨투맨"], ["상의", "맨투맨", "기모 맨투맨"],
  ["상의", "티셔츠", "반팔 티셔츠"], ["상의", "티셔츠", "긴팔 티셔츠"], ["상의", "셔츠", "기본 셔츠"],
  ["상의", "후드", "후드 집업"], ["하의", "팬츠", "와이드 팬츠"], ["하의", "팬츠", "조거 팬츠"],
  ["하의", "데님", "스트레이트 데님"], ["하의", "스커트", "플레어 스커트"], ["아우터", "재킷", "테일러드 재킷"],
  ["아우터", "코트", "롱 코트"], ["아우터", "점퍼", "블루종"], ["원피스", "데일리", "A라인 원피스"],
  ["원피스", "길이", "롱 원피스"], ["셋업", "캐주얼", "맨투맨 팬츠 셋업"], ["잡화", "가방", "토트백"],
  ["홈웨어", "세트", "파자마 세트"], ["상의", "맨투맨", "크롭 맨투맨"], ["상의", "니트", "기본 니트"],
];

const CATEGORY_WEIGHT_PATTERN = [0,0,0,0,0,0,0,0,1,1,1,1,1,2,2,2,3,3,3,4,4,5,5,6,7,7,8,9,10,11,12,13,14,15,16,17,18];
const PRODUCT_CATEGORY_NODE_COUNT = (() => {
  const level1 = new Set();
  const level2 = new Set();
  const level3 = new Set();
  for (const [category1, category2, category3] of PRODUCT_CATEGORY_FIXTURES) {
    level1.add(category1);
    level2.add(`${category1}::${category2}`);
    level3.add(`${category1}::${category2}::${category3}`);
  }
  return level1.size + level2.size + level3.size;
})();
const MEMBER_PERMISSION_SCENARIOS = [
  { label: "고객사 관리자", permissions: "all" },
  { label: "디자이너 - 발주 가능", role: "designer", permissions: ["workorder.read","workorder.create","workorder.update","workorder.status.review","workorder.status.order","material.order.request","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "디자이너 - 발주 불가", role: "designer", permissions: ["workorder.read","workorder.create","workorder.update","workorder.status.review","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "재고 담당 - 발주 가능", role: "inventory_manager", permissions: ["workorder.read","material.order.request","material.order.place","partner.read","partner.update","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "재고 담당 - 발주 불가", role: "inventory_manager", permissions: ["workorder.read","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "검수 담당 - 검수 가능", role: "inspector", permissions: ["workorder.read","workorder.status.inspect","workorder.status.complete","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "검수 담당 - 검수 불가", role: "inspector", permissions: ["workorder.read","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "조회 전용", role: "viewer", permissions: ["workorder.read","partner.read","standards.read","storage.read","stats.read","personal_settings.manage"] },
  { label: "복합 권한 - 발주·검수", role: "designer", permissions: ["workorder.read","workorder.update","workorder.status.order","workorder.status.inspect","material.order.request","material.order.place","partner.read","stats.read","personal_settings.manage"] },
];
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
      partnerItems: company.partners,
      itemCategories: PRODUCT_CATEGORY_NODE_COUNT,
      outsourcingProcesses: 5,
      workorders: company.workorders,
      orders: company.partners > 0 ? company.workorders : 0,
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
      `INSERT INTO companies (
         id,name,is_active,onboarding_status,onboarding_completed_at,owner_user_id,
         english_name,business_name,business_registration_number,postal_code,road_address,jibun_address,address_detail,address_extra,
         requested_plan_code,storage_limit_bytes,member_limit,billing_status,subscription_status,trial_started_at,trial_ends_at
       )
       VALUES (
         $1,$2,$3,$4,CASE WHEN $4::text = 'active' THEN now() ELSE NULL END,$5,
         $6,$7,$8,$9,$10,$11,$12,$13,
         $14,$15,$16,$17,$18,now(),now()+interval '30 days'
       )
       ON CONFLICT (id) DO UPDATE SET
         name=EXCLUDED.name,is_active=EXCLUDED.is_active,onboarding_status=EXCLUDED.onboarding_status,
         onboarding_completed_at=EXCLUDED.onboarding_completed_at,owner_user_id=EXCLUDED.owner_user_id,
         english_name=EXCLUDED.english_name,business_name=EXCLUDED.business_name,
         business_registration_number=EXCLUDED.business_registration_number,postal_code=EXCLUDED.postal_code,
         road_address=EXCLUDED.road_address,jibun_address=EXCLUDED.jibun_address,
         address_detail=EXCLUDED.address_detail,address_extra=EXCLUDED.address_extra,
         requested_plan_code=EXCLUDED.requested_plan_code,storage_limit_bytes=EXCLUDED.storage_limit_bytes,
         member_limit=EXCLUDED.member_limit,billing_status=EXCLUDED.billing_status,
         subscription_status=EXCLUDED.subscription_status,updated_at=now()`,
      [
        row.companyId, row.companyName, source.status !== "suspended", row.onboardingStatus, ownerId,
        `WAFL SIM ${source.code}`, `[SIM] ${source.code} 사업자`,
        `999-${String(source.code.charCodeAt(0)).padStart(2, "0")}-${String(source.members).padStart(5, "0")}`,
        "00000", `[SIM] 테스트로 ${source.code}길 1`, `[SIM] 테스트동 ${source.code}-1`,
        `${source.code}동 ${Math.max(source.members, 1)}호`, "dev/test fixture",
        row.planCode, source.storage.quotaBytes, source.memberLimit, source.billing, row.subscriptionStatus,
      ],
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
      const scenario = row.companyId === "wafl-fn-company-b" ? MEMBER_PERMISSION_SCENARIOS[i % MEMBER_PERMISSION_SCENARIOS.length] : null;
      const role = scenario?.role ?? roleFor(i);
      const displayName = scenario ? `[SIM] ${scenario.label} ${index}` : `[SIM] ${source.code} 사용자 ${index}`;
      await client.query(
        `INSERT INTO users (id,company_id,email,name,phone,phone_source,role,is_active)
         VALUES ($1,$2,$3,$4,$5,'user',$6,$7)
         ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,phone=EXCLUDED.phone,phone_source=EXCLUDED.phone_source,role=EXCLUDED.role,is_active=EXCLUDED.is_active,updated_at=now()`,
        [
          userId, row.companyId, `${row.companyId}.${index}@example.test`, displayName,
          `010-${String(source.code.charCodeAt(0)).padStart(4, "0")}-${String(i + 1).padStart(4, "0")}`,
          role, source.status !== "suspended",
        ],
      );
      await client.query(
        `WITH removed_stale_memberships AS (
           DELETE FROM company_users
            WHERE company_id = $2
              AND user_id = $3
              AND id <> $1
         )
         INSERT INTO company_users (id,company_id,user_id,role,is_active,display_name,joined_at)
         VALUES ($1,$2,$3,$4,$5,$6,now())
         ON CONFLICT (id) DO UPDATE SET
           company_id=EXCLUDED.company_id,
           user_id=EXCLUDED.user_id,
           role=EXCLUDED.role,
           is_active=EXCLUDED.is_active,
           display_name=EXCLUDED.display_name,
           updated_at=now()`,
        [`${row.companyId}-membership-${index}`, row.companyId, userId, role, source.status !== "suspended", displayName],
      );
      await client.query(
        `INSERT INTO company_members (id,company_id,user_id,status,role_template_code,display_name,approved_by,approved_at,suspended_by,suspended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,now(),$8,CASE WHEN $4::text = 'suspended' THEN now() ELSE NULL END)
         ON CONFLICT (company_id,user_id) DO UPDATE SET status=EXCLUDED.status,role_template_code=EXCLUDED.role_template_code,display_name=EXCLUDED.display_name,approved_by=EXCLUDED.approved_by,approved_at=EXCLUDED.approved_at,suspended_by=EXCLUDED.suspended_by,suspended_at=EXCLUDED.suspended_at,updated_at=now()`,
        [`${row.companyId}-member-${index}`, row.companyId, userId, source.status !== "suspended" ? "approved" : "suspended", role === "admin" ? "company_admin" : role, displayName, ownerId, source.status === "suspended" ? ownerId : null],
      );
      const memberId = `${row.companyId}-member-${index}`;
      await client.query(`DELETE FROM member_permissions WHERE company_member_id = $1`, [memberId]);
      if (scenario?.permissions === "all") {
        await client.query(
          `INSERT INTO member_permissions (company_member_id,permission_code,is_enabled,granted_by,granted_at)
           SELECT $1, permission_key, true, $2, now() FROM permission_catalog WHERE is_active = true AND is_system_permission = false
           ON CONFLICT (company_member_id,permission_code) DO UPDATE SET is_enabled=true,granted_by=EXCLUDED.granted_by,granted_at=now(),updated_at=now()`,
          [memberId, ownerId],
        );
      } else if (scenario) {
        for (const permissionCode of scenario.permissions) {
          await client.query(
            `INSERT INTO member_permissions (company_member_id,permission_code,is_enabled,granted_by,granted_at)
             VALUES ($1,$2,true,$3,now())
             ON CONFLICT (company_member_id,permission_code) DO UPDATE SET is_enabled=true,granted_by=EXCLUDED.granted_by,granted_at=now(),updated_at=now()`,
            [memberId, permissionCode, ownerId],
          );
        }
      } else {
        await client.query(
          `INSERT INTO member_permissions (company_member_id,permission_code,is_enabled,granted_by,granted_at)
           SELECT $1, rtp.permission_code, true, $2, now()
             FROM role_templates rt
             JOIN role_template_permissions rtp ON rtp.role_template_id = rt.id AND rtp.is_enabled = true
            WHERE rt.company_id IS NULL AND rt.role_code = $3 AND rt.is_active = true
           ON CONFLICT (company_member_id,permission_code) DO UPDATE SET is_enabled=true,granted_by=EXCLUDED.granted_by,granted_at=now(),updated_at=now()`,
          [memberId, ownerId, role === "admin" ? "company_admin" : role],
        );
      }
    }

    const processIds = new Map();
    for (const [processIndex, processName] of ["나염", "자수", "워싱", "검수", "포장"].entries()) {
      const processId = `${row.companyId}-process-${String(processIndex + 1).padStart(2, "0")}`;
      processIds.set(processName, processId);
      await client.query(
        `INSERT INTO outsourcing_processes (id,company_id,company_name,name,memo,sort_order,is_active)
         VALUES ($1,$2,$3,$4,'[SIM] dev/test 기본 공정',$5,true)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,memo=EXCLUDED.memo,sort_order=EXCLUDED.sort_order,is_active=true,updated_at=now()`,
        [processId, row.companyId, row.companyName, processName, processIndex + 1],
      );
    }

    // Simulator 분류는 경로마다 부모를 복제하지 않고 동일 부모 노드를 공유한다.
    // 이전 버전에서 생성된 중복 계층을 먼저 제거한 뒤 정규화된 트리를 재생성한다.
    await client.query(`DELETE FROM item_categories WHERE company_id=$1`, [row.companyId]);

    const categoryIds = [];
    const categoryNodeIds = new Map();
    const levelSortOrders = [new Map(), new Map(), new Map()];
    const nextSortOrder = (levelIndex, key) => {
      const sortMap = levelSortOrders[levelIndex];
      if (!sortMap.has(key)) sortMap.set(key, sortMap.size + 1);
      return sortMap.get(key);
    };
    const stableCategoryId = (level, pathKey) => {
      const encoded = Buffer.from(pathKey, "utf8").toString("hex").slice(0, 48);
      return `${row.companyId}-category-l${level}-${encoded}`;
    };

    for (const categoryPath of PRODUCT_CATEGORY_FIXTURES) {
      let parentId = null;
      const ids = [];
      const pathParts = [];
      for (const [levelIndex, categoryName] of categoryPath.entries()) {
        pathParts.push(categoryName);
        const pathKey = pathParts.join("::");
        let categoryId = categoryNodeIds.get(pathKey);
        if (!categoryId) {
          categoryId = stableCategoryId(levelIndex + 1, pathKey);
          categoryNodeIds.set(pathKey, categoryId);
          const siblingKey = `${parentId ?? "root"}::${categoryName}`;
          await client.query(
            `INSERT INTO item_categories (id,company_id,parent_id,level,name,is_active,sort_order)
             VALUES ($1,$2,$3,$4,$5,true,$6)
             ON CONFLICT (id) DO UPDATE SET parent_id=EXCLUDED.parent_id,level=EXCLUDED.level,name=EXCLUDED.name,is_active=true,sort_order=EXCLUDED.sort_order,updated_at=now()`,
            [categoryId, row.companyId, parentId, levelIndex + 1, categoryName, nextSortOrder(levelIndex, siblingKey)],
          );
        }
        ids.push(categoryId);
        parentId = categoryId;
      }
      categoryIds.push(ids);
    }

    for (let i = 0; i < source.partners; i += 1) {
      const index = String(i + 1).padStart(4, "0");
      const partnerFixture = PARTNER_FIXTURE_TYPES[i % PARTNER_FIXTURE_TYPES.length];
      const partnerId = `${row.companyId}-partner-${index}`;
      const partnerName = `[SIM] ${partnerFixture.label} ${index}`;
      await client.query(
        `INSERT INTO partners (id,company_id,company_name,name,contact_person,contact,email,memo,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,contact_person=EXCLUDED.contact_person,contact=EXCLUDED.contact,email=EXCLUDED.email,memo=EXCLUDED.memo,is_active=true,updated_at=now()`,
        [partnerId, row.companyId, row.companyName, partnerName, `담당 ${index}`, `010-0000-${String(i + 1).padStart(4, "0")}`, `${row.companyId}.partner.${index}@example.test`, `[SIM] ${partnerFixture.itemType} fixture`],
      );
      await client.query(
        `INSERT INTO partner_items (id,company_id,company_name,partner_id,item_type,item_name,outsourcing_process_id,unit,unit_cost,memo,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'[SIM] 업체 유형 연결',true)
         ON CONFLICT (id) DO UPDATE SET item_type=EXCLUDED.item_type,item_name=EXCLUDED.item_name,outsourcing_process_id=EXCLUDED.outsourcing_process_id,unit=EXCLUDED.unit,unit_cost=EXCLUDED.unit_cost,memo=EXCLUDED.memo,is_active=true,updated_at=now()`,
        [`${partnerId}-item`, row.companyId, row.companyName, partnerId, partnerFixture.itemType, partnerFixture.label, partnerFixture.process ? processIds.get(partnerFixture.process) : null, partnerFixture.unit, 1000 + (i * 100)],
      );
    }

    for (let i = 0; i < source.workorders; i += 1) {
      const index = String(i + 1).padStart(5, "0");
      const weightedCategoryIndex = CATEGORY_WEIGHT_PATTERN[(i + source.code.charCodeAt(0)) % CATEGORY_WEIGHT_PATTERN.length] % PRODUCT_CATEGORY_FIXTURES.length;
      const categoryPath = PRODUCT_CATEGORY_FIXTURES[weightedCategoryIndex];
      const categoryPathIds = categoryIds[weightedCategoryIndex];
      const factoryPartnerCount = Math.max(1, Math.ceil(source.partners / PARTNER_FIXTURE_TYPES.length));
      const factoryPartnerIndex = source.partners > 0 ? ((i % factoryPartnerCount) * PARTNER_FIXTURE_TYPES.length) + 1 : null;
      const factoryName = factoryPartnerIndex ? `[SIM] ${PARTNER_FIXTURE_TYPES[(factoryPartnerIndex - 1) % PARTNER_FIXTURE_TYPES.length].label} ${String(factoryPartnerIndex).padStart(4, "0")}` : "";
      const createdDaysAgo = (i * 7 + source.code.charCodeAt(0) * 3) % 120;
      await client.query(
        `INSERT INTO spec_sheets (id,company_id,company_name,title,status,workflow_path,display_title,category1_id,category2_id,category3_id,category1,category2,category3,season,priority,vendor,manager,manager_id,created_by_id,created_by_role,due_date,quantity,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,'standard_review',$4,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16,'admin',$17,$18,now()-($19::text||' days')::interval,now()-($20::text||' days')::interval)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,status=EXCLUDED.status,display_title=EXCLUDED.display_title,category1_id=EXCLUDED.category1_id,category2_id=EXCLUDED.category2_id,category3_id=EXCLUDED.category3_id,category1=EXCLUDED.category1,category2=EXCLUDED.category2,category3=EXCLUDED.category3,season=EXCLUDED.season,priority=EXCLUDED.priority,vendor=EXCLUDED.vendor,manager=EXCLUDED.manager,manager_id=EXCLUDED.manager_id,due_date=EXCLUDED.due_date,quantity=EXCLUDED.quantity,created_at=EXCLUDED.created_at,updated_at=EXCLUDED.updated_at`,
        [`${row.companyId}-workorder-${index}`, row.companyId, row.companyName, `[SIM] ${categoryPath[2]} ${index}`, workorderStatus(i), categoryPathIds[0], categoryPathIds[1], categoryPathIds[2], categoryPath[0], categoryPath[1], categoryPath[2], i % 2 === 0 ? "2026 SS" : "2026 FW", i % 7 === 0 ? "high" : "normal", factoryName, `[SIM] ${source.code} 관리자`, ownerId, i % 4 === 0 ? null : `2026-${String(((i % 7) + 6)).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, ([36,72,120,180,240,360,500,800][(i * 5 + source.code.charCodeAt(0)) % 8]), createdDaysAgo, Math.max(0, createdDaysAgo - (i % 3))],
      );
      if (factoryPartnerIndex) {
        const factoryPartnerId = `${row.companyId}-partner-${String(factoryPartnerIndex).padStart(4, "0")}`;
        await client.query(
          `INSERT INTO orders (id,company_id,spec_sheet_id,source_order_entry_id,factory_partner_id,factory_name,quantity,due_date,labor_cost,loss_cost,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (id) DO UPDATE SET factory_partner_id=EXCLUDED.factory_partner_id,factory_name=EXCLUDED.factory_name,quantity=EXCLUDED.quantity,due_date=EXCLUDED.due_date,labor_cost=EXCLUDED.labor_cost,loss_cost=EXCLUDED.loss_cost,status=EXCLUDED.status`,
          [`${row.companyId}-order-${index}`, row.companyId, `${row.companyId}-workorder-${index}`, `${row.companyId}-order-entry-${index}`, factoryPartnerId, factoryName, (i % 100) + 1, `2026-${String(((i % 7) + 6)).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, 5000 + (i % 10) * 500, i % 9 === 0 ? 1000 : 0, workorderStatus(i) === "completed" ? "completed" : "draft"],
        );
      }
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
