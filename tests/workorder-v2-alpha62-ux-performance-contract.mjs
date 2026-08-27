#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";

const read = (file) => readFileSync(file, "utf8");
const api = readMobileApiSource();
const apiTransport = read("apps/mobile/lib/apiTransport.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const view = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const sheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const repository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const timing = read("lib/api/waflPerformanceTiming.ts");
const commandRoute = read("lib/domain/work-orders/command/commandRoute.ts");
const materialRoute = read("lib/domain/work-orders/command/materialCommandRoute.ts");
const structureRoute = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const measurementRoute = read("lib/domain/work-orders/measurement/measurementCommandRoute.ts");
const runner = read("scripts/run-wafl-v2-alpha62-size-measurement-runtime-qa.mjs");

for (const label of ["WAFL 추천", "저장 스펙", "새 스펙 저장", "기존 스펙 업데이트"]) {
  assert.ok(sheets.includes(label), `integrated template UX missing ${label}`);
}
assert.doesNotMatch(sheets, /현재 완성 스펙의 항목과 일치하는 값을|작업지시서 사이즈는 그대로 유지됩니다|아래 V를 누를 때만 변경됩니다/);
assert.match(view, /loadedTemplateIdentity\.current === templateQueryIdentity/);
assert.match(view, /getMeasurementTemplates\(current\.workOrderId, effectiveCategoryCode, current\.genderCode\)/);
assert.match(repository, /kind === "save-company-template" \|\| kind === "update-company-template"/);
assert.match(repository, /templateVersion = predecessor \? Number\(predecessor\.template_version\) \+ 1 : 1/);
assert.match(repository, /UPDATE size_spec_templates SET is_active=false/);
assert.doesNotMatch(read("lib/domain/work-orders/measurement/companyTemplateRepository.ts"), /template_version\s*=\s*template_version\s*\+/);

for (const kind of ["measurement-command", "size-command", "color-command", "quantity-command", "material-patch", "material-create", "overview-patch", "detail-get"]) {
  assert.ok(`${apiTransport}\n${api}`.includes(`"${kind}"`), `mobile request timing kind missing ${kind}`);
}
for (const header of ["X-WAFL-Timing-Route-Ms", "X-WAFL-Timing-Guard-Ms", "X-WAFL-Timing-Product-Ms"]) {
  assert.ok(timing.includes(header), `server timing owner missing ${header}`);
}
for (const route of [commandRoute, materialRoute, structureRoute, measurementRoute]) {
  assert.match(route, /startWaflRouteTiming/);
  assert.match(route, /timing\.headers/);
}
assert.match(experience, /canonicalGetCount: 0/);
assert.match(controller, /onVersionReconcile/);
assert.match(controller, /followUpRequests: projectionImpact\?\.workOrderSizeSpecGets \?\? 0/);
assert.match(runner, /WAFL_ALPHA62_PERFORMANCE_PHASE/);
assert.match(runner, /performance-before|performance-\$\{performancePhase\}/);
console.log("workorder v2 alpha.62 integrated UX/performance contract: PASS");
