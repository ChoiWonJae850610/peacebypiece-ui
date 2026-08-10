import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createWaflInputCommitGuard } from "../apps/mobile/features/inputs/waflInputCommitGuard.ts";
const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const shell = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const migration003 = read("db/v2/migrations/003_v2_revision_content.sql");
const migration005 = read("db/v2/migrations/005_v2_documents_access_events.sql");
const migration006 = read("db/v2/migrations/006_v2_deferred_constraints_indexes.sql");
const sizeColorRepository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

assert.match(shell, />WAFL INPUT</);
assert.match(shell, /KeyboardAvoidingView/);
assert.match(shell, /Math\.max\(insets\.bottom, WAFL_THEME\.spacing\.md\)/);
assert.match(shell, /createWaflInputCommitGuard/);
assert.match(shell, /accessibilityState=\{\{ busy: actionPending, disabled: actionPending \|\| confirmDisabled \}\}/);
assert.match(reel, /<WaflInputSheet/);
assert.match(structure, /<WaflInputSheet/);
assert.match(structure, /title=\{props\.kind === "size" \? "사이즈" : "색상"\}/);
assert.doesNotMatch(structure, /doneButton|doneButtonText|>완료<|>변경 저장</);
assert.doesNotMatch(structure, /onSubmitEditing=\{\(\) => void save\(\)\}/);

assert.match(structure, /structureAction:[\s\S]{0,240}backgroundColor: "#17263d"[\s\S]{0,180}borderRadius: 8[\s\S]{0,220}minHeight: 44/);
assert.match(structure, /addAction:[\s\S]{0,220}minHeight: 44/);
assert.match(structure, /editAction:[\s\S]{0,220}minHeight: 44/);
assert.doesNotMatch(structure, /structureCard:|countLink:|textDecorationLine: "underline"/);

assert.match(materials, /MaterialInlineField[^\n]+field="unitPrice"[^\n]+label="단가"[^\n]+testID="material-inline-unit-price"/);
assert.match(materials, /MaterialInlineField[^\n]+field="unitPrice"[^\n]+keyboardType="number-pad"/);
assert.match(materialEditor, /<EditorField field="unitPrice" keyboardType="number-pad"/);
assert.doesNotMatch(`${materials}\n${materialEditor}`, /reelTarget\.field === "unitPrice"|kind="currency"/);
assert.equal((materials.match(/function MaterialCard\(/g) ?? []).length, 1, "fabric and accessory cards must share one implementation");
assert.doesNotMatch(reel, /"currency"|kind === "currency"/);

const guard = createWaflInputCommitGuard();
let requestCount = 0;
let release;
const held = new Promise((resolve) => { release = resolve; });
const first = guard.submit(async () => { requestCount += 1; await held; return "saved"; });
const duplicate = await guard.submit(async () => { requestCount += 1; return "duplicate"; });
assert.deepEqual(duplicate, { accepted: false });
assert.equal(requestCount, 1, "one Check action may create at most one request");
release();
assert.deepEqual(await first, { accepted: true, value: "saved" });

let failed = false;
try {
  await guard.submit(async () => { throw new Error("server failed"); });
} catch {
  failed = true;
}
assert.equal(failed, true);
assert.equal(guard.isActive(), false, "failure must release the commit guard for a deliberate retry");
assert.match(structure, /if \(!saved\)[\s\S]{0,260}setName\([\s\S]{0,260}setHex\(/);
assert.match(experience, /rollback/);

for (const table of ["work_order_colors", "work_order_sizes", "color_size_quantities", "work_order_size_specs", "work_order_size_spec_sizes", "work_order_size_spec_values"]) {
  assert.match(migration003, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
}
assert.match(migration003, /color_id uuid NOT NULL REFERENCES work_order_colors\(id\) ON DELETE RESTRICT/);
assert.match(migration003, /size_id uuid NOT NULL REFERENCES work_order_sizes\(id\) ON DELETE RESTRICT/);
assert.match(migration003, /size_row_id uuid NOT NULL REFERENCES work_order_size_spec_sizes\(id\) ON DELETE RESTRICT/);
assert.match(migration006, /color_size_quantities_color_company_fk[\s\S]{0,220}ON DELETE RESTRICT/);
assert.match(migration006, /color_size_quantities_size_company_fk[\s\S]{0,220}ON DELETE RESTRICT/);
assert.match(migration006, /work_order_size_spec_values_size_company_fk[\s\S]{0,240}ON DELETE RESTRICT/);
assert.match(migration005, /CREATE TRIGGER domain_events_append_only_guard[\s\S]{0,120}BEFORE UPDATE OR DELETE ON domain_events/);
assert.match(sizeColorRepository, /function assertCurrentDraft[\s\S]{0,280}work_order_status !== "draft"[\s\S]{0,180}revision_status !== "draft"/);
assert.match(sizeColorRepository, /DELETE FROM \$\{config\.table\}/);
assert.equal(fs.existsSync(path.join(root, "app/api/v2/work-orders/[workOrderId]/size-color/sizes/[sizeRowId]/delete/route.ts")), false);
assert.equal(fs.existsSync(path.join(root, "app/api/v2/work-orders/[workOrderId]/size-color/colors/[colorId]/delete/route.ts")), false);
assert.doesNotMatch(migration003, /work_order_(?:sizes|colors)[\s\S]{0,240}(?:archived_at|deleted_at)/);
assert.match(runtimeQa, /ALPHA59_CARET_MATRIX_TOTAL_IPHONE_REQA_REQUIRED/);
assert.match(runtimeQa, /ALPHA59_CARET_MATRIX_TOTAL_BLOCKED/);

console.log("workorder v2 alpha.59 input UX polish contract: PASS");
