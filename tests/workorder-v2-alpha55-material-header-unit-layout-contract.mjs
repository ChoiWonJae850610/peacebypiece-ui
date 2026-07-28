#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createMaterialHeaderPresentation,
  MATERIAL_HEADER_NAME_MAX_LINES,
} from "../apps/mobile/features/materials/materialHeaderLayoutModel.ts";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const names = [
  "짧은 이름",
  "중간 길이 원단 이름",
  "두 줄에 걸쳐 표시될 수 있는 원단 이름",
  "매우 긴 한글 원단 이름이 badge cluster의 고정 공간을 침범하지 않는지 확인하는 이름",
  "VERY_LONG_ENGLISH_MATERIAL_NAME_THAT_MUST_NOT_MOVE_THE_BADGE_CLUSTER",
];
const units = ["m", "yd", "kg", "벌", "장"];
const statuses = ["발주 전", "발주요청", "발주완료", "과거 취소"];

assert.equal(MATERIAL_HEADER_NAME_MAX_LINES, 2);
for (const name of names) {
  for (const unitCode of units) {
    for (const statusLabel of statuses) {
      const presentation = createMaterialHeaderPresentation({ name, unitCode, statusLabel });
      assert.equal(presentation.name, name, "layout policy must not rewrite material data");
      assert.equal(presentation.maxNameLines, 2);
      assert.deepEqual(presentation.badgeCluster, [
        { kind: "unit", text: unitCode },
        { kind: "status", text: statusLabel },
      ]);
    }
  }
}

const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const reelValue = read("apps/mobile/features/inputs/reel-picker/ReelInlineEditValue.tsx");
const runtimeQa = read("scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs");

assert.match(materials, /const headerPresentation = createMaterialHeaderPresentation/);
assert.match(materials, /style=\{styles\.materialIdentity\}[\s\S]*?style=\{styles\.headerAside\}/);
assert.match(materials, /testID="material-header-badge-cluster"[\s\S]*?field="unitCode"[\s\S]*?styles\.statusBadge/);
assert.match(materials, /displayNumberOfLines=\{1\}/);
assert.match(materials, /maxFontSizeMultiplier=\{1\.3\}[\s\S]*?numberOfLines=\{1\}/);
assert.match(materials, /materialIdentity: \{ flex: 1, minWidth: 0 \}/);
assert.match(materials, /headerAside: \{[^\n]*flexShrink: 0/);
assert.match(materials, /headerBadgeCluster: \{[^\n]*flexDirection: "row"[^\n]*flexShrink: 0[^\n]*flexWrap: "nowrap"[^\n]*gap: 6/);
assert.match(materials, /materialName: \{[^\n]*minWidth: 0[^\n]*width: "100%"/);
assert.match(materials, /statusBadge: \{[^\n]*flexShrink: 0[^\n]*lineHeight: 14/);
assert.doesNotMatch(materials, /materialTitleRow/);
const materialCard = materials.slice(
  materials.indexOf("function MaterialCard("),
  materials.indexOf("function AddMaterialButton("),
);
assert.match(materialCard, /const headerPresentation = createMaterialHeaderPresentation/);
assert.match(materialCard, /styles\.headerBadgeCluster[\s\S]*?field="unitCode"[\s\S]*?styles\.statusBadge[\s\S]*?headerPresentation\.badgeCluster\[1\]\.text/);
assert.doesNotMatch(materials, /function ArchivedMaterialCard|archivedBadgeCluster|archivedUnitChip|archivedBadge/);
assert.match(reelValue, /readonly displayNumberOfLines\?: number/);
assert.match(reelValue, /displayNumberOfLines = 2/);
assert.match(runtimeQa, /--header-layout-readonly/);
assert.match(runtimeQa, /assertReadOnlyRunnerState/);
assert.match(runtimeQa, /\/api\/v2\/work-orders\?limit=50/);
assert.match(runtimeQa, /materials\?type=fabric&lifecycle=active&limit=30/);
assert.match(runtimeQa, /console\.log\(JSON\.stringify\(record\)\)/);
assert.match(runtimeQa, /assertionInput\.statuses, \[200, 200, 200\]/);
assert.match(runtimeQa, /mutationMethods: 0/);
const headerReadSlice = runtimeQa.slice(
  runtimeQa.indexOf("async function runHeaderLayoutRead"),
  runtimeQa.indexOf("async function snapshotWriteVerify"),
);
assert.doesNotMatch(headerReadSlice, /method: "POST"/);

console.log("workorder v2 alpha.55 material header unit fixed-position layout contract: PASS");
