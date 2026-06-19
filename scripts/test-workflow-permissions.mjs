import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const rootDir = process.cwd();
const moduleCache = new Map();

function resolveModulePath(request, parentFile) {
  if (request === "server-only") return request;

  const basePath = request.startsWith("@/")
    ? resolve(rootDir, request.slice(2))
    : resolve(dirname(parentFile), request);

  if (extname(basePath)) return basePath;

  for (const extension of [".ts", ".tsx", ".js", ".mjs"]) {
    const candidate = `${basePath}${extension}`;
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      // Continue.
    }
  }

  throw new Error(`테스트 모듈을 찾을 수 없습니다: ${request} (${parentFile})`);
}

function loadTypeScriptModule(filePath) {
  const absolutePath = resolve(filePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const source = readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(absolutePath, module);

  const localRequire = (request) => {
    const resolved = resolveModulePath(request, absolutePath);
    if (resolved === "server-only") return {};
    return loadTypeScriptModule(resolved);
  };

  const wrapper = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname) { ${compiled}\n})`,
    { filename: absolutePath },
  );

  wrapper(
    module.exports,
    localRequire,
    module,
    absolutePath,
    dirname(absolutePath),
  );

  return module.exports;
}

function testWorkOrderWorkflowRules() {
  const rules = loadTypeScriptModule(
    resolve(rootDir, "lib/constants/workorderStates.ts"),
  );
  const state = rules.WORKFLOW_STATE;

  assert.equal(rules.canEditBeforeOrder(state.draft, false), true);
  assert.equal(rules.canEditBeforeOrder(state.rejected, false), true);
  assert.equal(rules.canEditBeforeOrder(state.reviewRequested, false), false);
  assert.equal(rules.canEditBeforeOrder(state.reviewCompleted, false), false);

  assert.equal(rules.canEditBeforeOrder(state.draft, true), true);
  assert.equal(rules.canEditBeforeOrder(state.reviewRequested, true), true);
  assert.equal(rules.canEditBeforeOrder(state.reviewCompleted, true), true);
  assert.equal(rules.canEditBeforeOrder(state.materialOrderPending, true), false);
  assert.equal(rules.canEditBeforeOrder(state.inspection, true), false);
  assert.equal(rules.canEditBeforeOrder(state.completed, true), false);

  assert.equal(
    rules.canChangeWorkOrderAssigneeInWorkflow(state.reviewCompleted),
    true,
  );
  assert.equal(
    rules.canChangeWorkOrderAssigneeInWorkflow(state.materialOrderPending),
    false,
  );
  assert.equal(
    rules.canChangeWorkOrderAssigneeInWorkflow(state.completed),
    false,
  );
}

function testMaterialOrderServerRules() {
  const policy = loadTypeScriptModule(
    resolve(rootDir, "lib/material-orders/serverPolicy.ts"),
  );
  const types = loadTypeScriptModule(
    resolve(rootDir, "lib/material-orders/types.ts"),
  );
  const status = types.MATERIAL_ORDER_STATUS;

  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.draft,
      isAdmin: false,
    }),
    true,
  );
  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.rejected,
      isAdmin: false,
    }),
    true,
  );
  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.reviewRequested,
      isAdmin: false,
    }),
    false,
  );
  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.reviewRequested,
      isAdmin: true,
    }),
    true,
  );
  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.approved,
      isAdmin: true,
    }),
    false,
  );
  assert.equal(
    policy.canEditMaterialOrderOnServer({
      status: status.orderPlaced,
      isAdmin: true,
    }),
    false,
  );

  const allowedTransitions = [
    [status.draft, status.reviewRequested],
    [status.draft, status.approved],
    [status.rejected, status.reviewRequested],
    [status.rejected, status.approved],
    [status.reviewRequested, status.draft],
    [status.reviewRequested, status.rejected],
    [status.reviewRequested, status.approved],
    [status.approved, status.orderPlaced],
  ];

  for (const [previous, next] of allowedTransitions) {
    assert.equal(
      policy.isAllowedMaterialOrderTransition({ previous, next }),
      true,
      `${previous} → ${next} 전환은 허용되어야 합니다.`,
    );
  }

  const blockedTransitions = [
    [status.draft, status.orderPlaced],
    [status.reviewRequested, status.orderPlaced],
    [status.approved, status.draft],
    [status.orderPlaced, status.draft],
    [status.cancelled, status.approved],
  ];

  for (const [previous, next] of blockedTransitions) {
    assert.equal(
      policy.isAllowedMaterialOrderTransition({ previous, next }),
      false,
      `${previous} → ${next} 전환은 차단되어야 합니다.`,
    );
  }
}

function testServerPermissionWiring() {
  const workOrderPolicy = readFileSync(
    resolve(rootDir, "lib/workorder/serverEditPolicy.ts"),
    "utf8",
  );
  const materialOrderRoute = readFileSync(
    resolve(rootDir, "app/api/material-orders/route.ts"),
    "utf8",
  );
  const materialOrderRepository = readFileSync(
    resolve(rootDir, "lib/material-orders/repository.ts"),
    "utf8",
  );

  assert.match(
    workOrderPolicy,
    /MEMBER_PERMISSION_CODE\.workorderStatusInspect/,
    "재고 저장은 재고 검수 권한을 사용해야 합니다.",
  );
  assert.match(
    workOrderPolicy,
    /WORKORDER_MANAGER_ADMIN_ONLY/,
    "담당자 변경의 관리자 전용 서버 검증이 필요합니다.",
  );
  assert.match(
    workOrderPolicy,
    /WORKORDER_MANAGER_LOCKED_AFTER_ORDER_REQUEST/,
    "발주요청 이후 담당자 변경 차단이 필요합니다.",
  );
  assert.match(
    materialOrderRoute,
    /MATERIAL_ORDER_STATUS_TRANSITION_NOT_ALLOWED/,
    "발주서 상태 전환 차단 응답이 필요합니다.",
  );
  assert.match(
    materialOrderRepository,
    /MATERIAL_ORDER_HEADER_LOCKED_BY_STATUS/,
    "발주서 헤더 상태 잠금이 필요합니다.",
  );
  assert.match(
    materialOrderRepository,
    /MATERIAL_ORDER_DETAIL_LOCKED_BY_STATUS/,
    "발주서 품목 상태 잠금이 필요합니다.",
  );
}


function testSimulatorPermissionScenarios() {
  const simulator = readFileSync(resolve(rootDir, "tools/simulator/commands/db-data.mjs"), "utf8");
  const consoleRepository = readFileSync(resolve(rootDir, "lib/dev/testContext/repository.ts"), "utf8");
  assert.match(simulator, /디자이너 - 발주 가능/);
  assert.match(simulator, /디자이너 - 발주 불가/);
  assert.match(simulator, /검수 담당 - 검수 가능/);
  assert.match(simulator, /검수 담당 - 검수 불가/);
  assert.match(simulator, /재고 담당 - 발주 가능/);
  assert.match(simulator, /조회 전용/);
  assert.match(simulator, /INSERT INTO member_permissions/);
  assert.match(consoleRepository, /permission_codes/);
}

const testCases = [
  ["작업지시서 상태별 편집 정책", testWorkOrderWorkflowRules],
  ["발주서 상태별 편집·전환 정책", testMaterialOrderServerRules],
  ["서버 권한 검증 연결", testServerPermissionWiring],
  ["Simulator 역할별 권한 시나리오", testSimulatorPermissionScenarios],
];

let passed = 0;

for (const [name, testCase] of testCases) {
  try {
    testCase();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

console.log(`PASS 권한 정책 자동 테스트 ${passed}/${testCases.length}`);
