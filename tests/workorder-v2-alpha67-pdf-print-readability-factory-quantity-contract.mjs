#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveIssuedPdfFactoryQuantity } from "../lib/generated-documents/work-order-pdf/quantityFormatter.ts";
import { ISSUED_PDF_CONTENT_PAGE_CAPACITY, paginateIssuedPdfSizeSpecRows } from "../lib/generated-documents/work-order-pdf/paginationPolicy.ts";

const source = fs.readFileSync("components/workorder/preview/IssuedWorkOrderDocument.tsx", "utf8");
const styles = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");

assert.equal(resolveIssuedPdfFactoryQuantity({ requiredQuantity: "1.000", allowanceQuantity: "1.000" }), "2");
assert.equal(resolveIssuedPdfFactoryQuantity({ requiredQuantity: "1.125", allowanceQuantity: "0.375" }), "1.5");
assert.equal(resolveIssuedPdfFactoryQuantity({ requiredQuantity: "28.000", allowanceQuantity: "0.000" }), "28");
assert.equal(resolveIssuedPdfFactoryQuantity({ requiredQuantity: "0.125", allowanceQuantity: null }), "0.125");
assert.throws(() => resolveIssuedPdfFactoryQuantity({ requiredQuantity: "not-a-number", allowanceQuantity: "0" }));
assert.equal(ISSUED_PDF_CONTENT_PAGE_CAPACITY, 38);
assert.equal(paginateIssuedPdfSizeSpecRows(Array.from({ length: 16 }, (_, index) => index)).length, 1);
assert.equal(paginateIssuedPdfSizeSpecRows(Array.from({ length: 17 }, (_, index) => index)).length, 2);

assert.match(source, /const AccessoryButtonIcon = createLucideIcon\("WaflFourHoleButton"[\s\S]*hole-4/u);
assert.match(source, /const PDF_SEMANTIC_ICONS = \{[\s\S]*fabric: Spool,[\s\S]*accessory: AccessoryButtonIcon,/u);
assert.match(source, /<th>수량<\/th>/u);
assert.doesNotMatch(source, /<th>필요수량<\/th>|<th>여유수량<\/th>/u);
assert.match(source, /resolveIssuedPdfFactoryQuantity\(row\)/u);
assert.match(styles, /--pdf-cover-title-size: 46px/u);
assert.match(styles, /--pdf-table-size: 10\.8px/u);
assert.match(styles, /\.sectionHeading \{[\s\S]*background: transparent;/u);
assert.match(styles, /\.sectionNumber \{[^}]*border-radius: \.8mm;/u);
assert.doesNotMatch(styles, /\.sectionHeading \{[^}]*background:\s*#102747/u);
assert.match(styles, /\.page th \{[^}]*background: var\(--pdf-table-head\)/u);
assert.match(styles, /\.pageNumberFooter \{[\s\S]*grid-template-columns: minmax\(0,1fr\) auto minmax\(0,1fr\)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-pdf-print-readability-factory-quantity",
  previousPermanentInventoryRetained: 177,
  addedPermanentChecks: 1,
  finalPermanentInventory: 178,
  physicalResultInferred: false,
}));
