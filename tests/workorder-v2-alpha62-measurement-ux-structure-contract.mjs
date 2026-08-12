#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const view = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const templateSheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const structureEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const repository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const detail = read("lib/domain/work-orders/read/detailRepository.ts");
const catalog = read("lib/catalog/systemCatalogPolicy.ts");
const commandCodes = read("lib/domain/work-orders/command/workOrderCommandCodes.ts");
const runner = read("scripts/run-wafl-v2-alpha62-size-measurement-runtime-qa.mjs");

for (const token of ["sectionIdentity", "decimal-pad", "normalizeCentimeterDraft", 'kind="eighth-inch"', "완성 스펙", "미입력 스펙값", "스펙 불러오기", "스펙 저장", "수정됨", "sourceTemplateModified"]) assert.ok(view.includes(token), `mobile measurement UX missing ${token}`);
for (const token of ["WAFL 추천", "저장 스펙", "새 스펙 저장", "기존 스펙 업데이트"]) assert.ok(templateSheets.includes(token), `template sheet UX missing ${token}`);
for (const rejected of ["현재 완성 스펙의 항목과 일치하는 값을", "작업지시서 사이즈는 그대로 유지됩니다.", "아래 V를 누를 때만 변경됩니다."]) assert.ok(!templateSheets.includes(rejected), `rejected normal-flow explanation remains: ${rejected}`);
assert.doesNotMatch(view, /onAddMeasurementSize|onRemoveMeasurementSize|MeasurementSizeChooser|치수표에서 제외/);
assert.match(reel, /kind === "quantity" \|\| eighthInch/);
assert.match(reel, /eighthInch \? "분수" : "소수"/);
assert.doesNotMatch(structureEditor, /영구 삭제/);
assert.doesNotMatch(repository, /kind\.startsWith\("remove-size"\)|kind\.startsWith\("add-size"\)|"add-size":|"remove-size":/);
assert.match(repository, /const workOrderSizeId=uuid\(input\.payload\.sizeRowId\)/);
assert.match(repository, /FROM work_order_sizes (?:ws|work_size)/);
for (const pair of [["body_length", "총장"], ["chest_width", "가슴단면"], ["shoulder_width", "어깨너비"]]) assert.ok(catalog.includes(`${pair[0]}: "${pair[1]}"`));
assert.match(commandCodes, /MEASUREMENT_SNAPSHOT_CONTENT_COMMAND_CODES/);
assert.doesNotMatch(commandCodes.match(/MEASUREMENT_SNAPSHOT_CONTENT_COMMAND_CODES[\s\S]+?\] as const;/)?.[0] ?? "", /unitSet/);
for (const token of ["source_apply_entity_version", "latest_content_entity_version", "sourceTemplateModified", "canonicalPomDisplayName"]) assert.ok(detail.includes(token), `read model missing ${token}`);
for (const token of ["size-add-l", "size-add-xl", "size-delete", "matrixSizeResidual", "workOrderSizeSourceOfTruth:true", "templateIntersectionOnly:true", "sourceTemplateModified,false", "sourceTemplateModified,true"]) assert.ok(runner.includes(token), `runtime coverage missing ${token}`);
console.log("workorder v2 alpha.62 measurement UX structure contract: PASS");
