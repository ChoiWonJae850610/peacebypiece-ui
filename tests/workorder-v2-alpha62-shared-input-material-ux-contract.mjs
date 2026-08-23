#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  decideInlineEditCommit,
  normalizeInlineEditValue,
} from "../apps/mobile/lib/inlineEditFinalization.ts";
import {
  attachmentFilenameRoundTripsJson,
  normalizeAttachmentFilenameForTransport,
} from "../apps/mobile/domain/attachmentFilenamePolicy.ts";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

assert.deepEqual(
  decideInlineEditCommit({ activationValue: "안감", draftValue: "", semantics: "nullable-text" }),
  { changed: true, value: "", nullableValue: null },
);
assert.deepEqual(
  decideInlineEditCommit({ activationValue: "  안감 ", draftValue: "안감", semantics: "nullable-text" }),
  { changed: false, value: "안감", nullableValue: "안감" },
);
assert.equal(normalizeInlineEditValue("01000.00", "numeric"), "1000");
assert.equal(
  decideInlineEditCommit({ activationValue: "1000.00", draftValue: "01000", semantics: "numeric" }).changed,
  false,
);

const koreanFilename = "생산 사양서_남성 티셔츠.pdf";
assert.equal(normalizeAttachmentFilenameForTransport(koreanFilename), koreanFilename);
assert.equal(normalizeAttachmentFilenameForTransport(encodeURIComponent(koreanFilename)), koreanFilename);
assert.equal(attachmentFilenameRoundTripsJson(koreanFilename), true);

const controlledInline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const materialRead = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
const materialValidation = read("apps/mobile/domain/workOrderValidation.ts");
const serverMaterialValidation = read("lib/domain/work-orders/command/materialValidation.ts");
const serverMaterialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const partnerPicker = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
const attachmentAcquisition = read("apps/mobile/features/work-orders/images/workOrderAttachmentAcquisition.ts");
const attachmentRoute = read("lib/domain/work-orders/command/attachmentCommandRoute.ts");
const attachmentRepository = read("lib/domain/work-orders/command/attachmentCommandRepository.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");

for (const token of ["decideInlineEditCommit", "valueSemantics", "activationValueRef"]) {
  assert.ok(controlledInline.includes(token), `shared inline owner missing ${token}`);
}
assert.ok(materialRead.includes("materialDraftFromLine(line)"), "material inline activation must use the persisted line value");
assert.ok(materialRead.includes('valueSemantics={nullableText ? "nullable-text" : undefined}'));
assert.ok(
  (overview.match(/valueSemantics="nullable-text"/g) ?? []).length >= 2
    || (overview.includes('categoryReelField === "seasonCode"') && overview.includes('categoryReelField === "categoryDetail"')),
  "overview nullable scalar inputs must retain explicit-null semantics or route through canonical staged PICK",
);
assert.ok(controlledInline.includes("semantics,"));
assert.ok(controlledInline.includes("onSave(decision.value)"));
for (const token of ["usage_area = CASE WHEN", "memo = CASE WHEN", "hasOwn(patch, \"usageArea\")", "hasOwn(patch, \"memo\")"]) {
  assert.ok(serverMaterialRepository.includes(token), `explicit nullable patch contract missing ${token}`);
}

for (const source of [materialValidation, serverMaterialValidation]) {
  assert.ok(source.includes("필요수량을 0보다 크게 입력해 주세요."));
}
assert.ok(materialValidation.includes("validateMaterialCreateDraft"));
assert.ok(materialValidation.includes("거래처를 선택해 주세요."));
assert.ok(materialValidation.includes("단가를 0보다 크게 입력해 주세요."));
assert.ok(experience.includes('editor.mode === "create"'));
assert.ok(experience.includes("validateMaterialCreateDraft"));
assert.ok(experience.includes("발주 요청 후에는 정보를 수정할 수 없습니다. 수정이 필요하면 발주요청을 취소해주세요."));

assert.ok(reel.includes("FiniteOptionReelColumn"));
assert.doesNotMatch(reel, /CircularOptionReelColumn|createCircularReelWindow|circularRecenterIndex/);
for (const token of ["single-choice-reel", "WaflOptionReel", "FiniteOptionReelColumn", "optionItems"]) assert.ok(reel.includes(token), `canonical reel option owner missing ${token}`);
assert.doesNotMatch(reel, /flatOptionList|flatOptionMetadata/);
for (const token of ["WaflReelPickerSheet", 'kind="option"', "optionItems", "onApply"]) assert.ok(partnerPicker.includes(token), `partner picker must use the canonical reel path: ${token}`);

assert.ok(attachmentAcquisition.includes("normalizeAttachmentFilenameForTransport"));
for (const token of ["originalFilename", "fileName", "JSON.stringify", "original_filename", "filename_snapshot"]) {
  assert.ok(`${attachmentRoute}\n${attachmentRepository}`.includes(token), `attachment Unicode path missing ${token}`);
}
assert.ok(detailRepository.includes("filename: String(row.filename)"));

const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
assert.ok(materialEditor.includes("<Save"));
assert.ok(materialEditor.includes("<X"));
assert.doesNotMatch(materialEditor, />\s*Done\s*</i);
assert.doesNotMatch(materialEditor, />\s*완료\s*</u);

console.log("WAFL v2 alpha.62 shared input/material UX contract: PASS");
