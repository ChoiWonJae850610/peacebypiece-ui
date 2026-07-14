#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const helper = read("apps/mobile/utils/previewLink.ts");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const actualPreview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const actualRenderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const localGuard = read("lib/internal/localOnlyRouteGuard.ts");

assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.36/);
assert.match(read("apps/mobile/constants/version.ts"), /2\.0\.0-alpha\.36/);
assert.equal(JSON.parse(read("apps/mobile/app.json")).expo.version, "2.0.0-alpha.36");
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, "2.0.0-alpha.36");
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).version, "2.0.0-alpha.36");

for (const token of ['kind: "issued-document"', 'kind: "dev-realistic-sample"']) assert.match(helper, new RegExp(token));
assert.match(helper, /\/workspace\/documents\/\$\{encodeURIComponent\(identity\.issuedDocumentNumber\)\}\/preview/);
assert.match(helper, /\/dev\/workorder-preview-sample/);
assert.match(helper, /process\.env\.NODE_ENV === "production"/);
assert.match(helper, /LOCAL_SAMPLE_HOSTS\.has\(new URL\(baseUrl\)\.hostname\)/);
assert.match(helper, /openPreviewTarget/);
assert.match(helper, /openIssuedPreview[\s\S]*kind: "issued-document"/);
const issuedBuilder = helper.match(/export function buildIssuedPreviewUrl[\s\S]*?\n\}/)?.[0] ?? "";
assert.doesNotMatch(issuedBuilder, /dev\/workorder-preview-sample|dev-realistic-sample/);

assert.match(mobile, /const previewTarget: PreviewTarget = \{ kind: "dev-realistic-sample" \}/);
assert.match(mobile, /openPreviewTarget\(previewTarget\)/);
assert.match(mobile, /<WorkOrderConfirmPanel[\s\S]*onPreview=\{openPreview\}/);
assert.match(mobile, /<DocumentWorkbench[\s\S]*onOpenPreview=\{onOpenPreview\}/);
assert.match(mobile, /<IconButton label="보기" icon="eye" onPress=\{onOpenPreview\}/);
assert.doesNotMatch(mobile, /openIssuedPreview\(|previewIdentity|productionCardMock\.issuedDocumentNumber/);

assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.match(localGuard, /LOCAL_HOST_NAMES/);
assert.doesNotMatch(`${actualPreview}\n${actualRenderer}`, /issuedWorkOrderPreviewSample|SampleIssuedWorkOrderPreview|dev-samples/);

const materialRow = mobile.match(/function MaterialRow\([\s\S]*?\n\}\n\ntype MaterialEditValues/)?.[0] ?? "";
const ordered = [
  "styles.rowHead",
  "styles.materialCoreRow",
  "styles.materialFactoryFields",
  'label="사용 부위"',
  'label="메모"',
  "styles.materialOrderActionRow",
  "styles.materialOrderActions",
];
let previous = -1;
for (const marker of ordered) {
  const index = materialRow.indexOf(marker);
  assert.ok(index > previous, `material footer order failed at ${marker}`);
  previous = index;
}
const afterFooter = materialRow.slice(materialRow.indexOf("styles.materialOrderActionRow"));
assert.doesNotMatch(afterFooter, /InlineEditableValue|materialCoreRow/);
assert.doesNotMatch(mobile, /materialStatusMessages|materialActionFooter|materialFooterMessages/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?borderTopWidth: 1/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?flexDirection: "row"/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?justifyContent: "space-between"/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?width: "100%"/);
assert.match(mobile, /materialOrderActions:[\s\S]*?flexShrink: 0[\s\S]*?flexWrap: "nowrap"/);
assert.match(materialRow, /testID="material-card"/);
assert.match(materialRow, /testID="material-order-action-row"/);
assert.match(materialRow, /\{actions\.length \? \([\s\S]*styles\.materialOrderActions/);
assert.doesNotMatch(materialRow, /position:\s*["']absolute|materialFooterSpacer/);

assert.match(inline, /height: COMPACT_FIELD_ROW_HEIGHT/);
assert.match(inline, /multiline=\{false\}/);
assert.match(inline, /if \(cancelledRef\.current \|\| completedRef\.current\) return/);
assert.match(inline, /if \(!props\.editable\) return <ReadOnlyInlineValue/);

for (const forbidden of ["fetch(", "POST", "PATCH", "PUT", "DELETE", "DATABASE_URL", "storageObjectKey", "tokenHash"]) {
  assert.ok(!`${helper}\n${mobile}`.includes(forbidden), `mobile Preview/footer contains forbidden ${forbidden}`);
}

console.log("workorder v2 alpha.34 mobile Preview and material footer contract: PASS");
