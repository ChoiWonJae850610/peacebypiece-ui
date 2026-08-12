#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const repository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const runner = read("scripts/run-wafl-v2-alpha62-size-measurement-runtime-qa.mjs");
const mobileApi = read("apps/mobile/lib/apiClient.ts");
const mobileController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const mobileView = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const templateSheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const transport = read("apps/mobile/domain/measurementCommandTransport.ts");

const templateLookup = repository.match(/SELECT id,template_version FROM size_spec_templates[^`]+/s)?.[0] ?? "";
assert.match(templateLookup, /company_id IS NULL OR company_id=\$2/);
assert.doesNotMatch(templateLookup, /FOR UPDATE/, "system template lookup must not request a tenant-invisible update lock");
for (const token of ["measurementCommandPath", "createApplyMeasurementTemplateCommand"]) {
  assert.ok(transport.includes(token), `canonical transport owner missing ${token}`);
  assert.ok(runner.includes(token), `runtime must use product-equivalent ${token}`);
}
assert.match(runner, /source_kind,name,template_version,is_active\) VALUES\(\$1,NULL,'system'/);
assert.match(runner, /structure\("sizes","POST"/);
assert.match(runner, /structure\("colors","POST"/);
assert.match(runner, /"apply",true/);
assert.ok(mobileApi.includes("measurementCommandPath"));
assert.ok(mobileController.includes("createApplyMeasurementTemplateCommand"));
assert.match(templateSheets, /<Check color=/);
assert.doesNotMatch(templateSheets, />Check</);
assert.match(templateSheets, /MeasurementTemplatePickerSheet/);
assert.match(mobileView, /setTemplatePickerOpen\(false\)/);
console.log("workorder v2 alpha.62 iPhone remediation contract: PASS");
