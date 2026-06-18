import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixture = JSON.parse(await readFile(new URL("./fixtures/functions/pdf-policy-scenarios.json", import.meta.url), "utf8"));
assert.equal(fixture.version, "0.23.69");
assert.equal(fixture.documents.length, 2);
for (const document of fixture.documents) {
  assert.ok(document.id);
  assert.ok(document.pendingDecisionIds.length > 0);
  assert.equal(new Set(document.pendingDecisionIds).size, document.pendingDecisionIds.length);
  assert.ok(document.currentFacts.length > 0);
}
const workorder = fixture.documents.find((item) => item.id === "workorder");
assert.ok(workorder.pendingDecisionIds.includes("amount-visibility"));
assert.ok(workorder.currentFacts.includes("amount-fields-currently-rendered"));
const supplier = fixture.documents.find((item) => item.id === "supplier-order");
assert.ok(supplier.pendingDecisionIds.includes("vendor-split"));
console.log(`functions pdf contract passed: documents=${fixture.documents.length}, pending=${fixture.documents.reduce((sum, item) => sum + item.pendingDecisionIds.length, 0)}`);
