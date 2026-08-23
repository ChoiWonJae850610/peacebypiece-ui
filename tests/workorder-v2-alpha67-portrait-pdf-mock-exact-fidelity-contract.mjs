#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveIssuedPdfCostPresentation } from "../lib/generated-documents/work-order-pdf/costPresentation.ts";

const source = fs.readFileSync("components/workorder/preview/IssuedWorkOrderDocument.tsx", "utf8");
const styles = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");

const labels = ["기본 공정 업체", "납기일", "총 수량", "장당 공임비", "시즌", "대상", "대분류", "세부품목", "문서 번호", "총 공임비"];
const positions = labels.map((label) => source.indexOf(`label="${label}"`));
assert.ok(positions.every((position) => position >= 0));
assert.deepEqual([...positions].sort((a, b) => a - b), positions);
assert.equal((source.match(/<CoverFact /gu) ?? []).length, 10);
assert.match(styles, /grid-template-rows: repeat\(5,minmax\(0,1fr\)\)/u);
assert.match(styles, /--pdf-card: #ffffff/u);
assert.match(styles, /--pdf-table-head: #f3f3f3/u);
assert.doesNotMatch(styles, /\.coverFact[^}]*background:\s*#eef3f5/u);
assert.doesNotMatch(styles, /\.page th[^}]*background:\s*#e5edf2/u);
assert.match(source, /resolveIssuedPdfCostPresentation\(\{ processes: data\.processes \}\)/u);
assert.doesNotMatch(source, /QRCode|QrCode|진행 중|개정차수|data-wafl-embedded-qr/u);

assert.deepEqual(resolveIssuedPdfCostPresentation({
  processes: [
    { role: "additional", unitPrice: "120.00", amount: "1200.00" },
    { role: "factory", unitPrice: "9800.00", amount: "980000.00" },
  ],
}), { basicProcessUnitPrice: "9800.00", basicProcessLaborAmount: "980000.00" });

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-portrait-pdf-mock-exact-fidelity",
  previousPermanentInventoryRetained: 176,
  addedPermanentChecks: 1,
  finalPermanentInventory: 177,
  physicalResultInferred: false,
}));
