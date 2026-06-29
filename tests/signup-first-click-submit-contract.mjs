import assert from "node:assert/strict";
import fs from "node:fs";

const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");

assert.ok(dashboard.includes("async function saveApplicationDraft()"), "dashboard must expose draft creation helper");
assert.ok(dashboard.includes("async function ensureSelectedConsents()"), "dashboard must store selected consent evidence before submit");
assert.ok(dashboard.includes("async function submitApplication()"), "dashboard must expose submit helper");
assert.match(
  dashboard,
  /async function submitApplication\(\)[\s\S]*await saveApplicationDraft\(\);[\s\S]*await ensureSelectedConsents\(\);[\s\S]*fetch\("\/api\/signup\/application\/submit"/,
  "first submit click must create/update draft, persist consent evidence, then submit",
);
assert.doesNotMatch(dashboard, /if \(!application\) \{\s*await saveDraft\(\);\s*return;\s*\}/);
assert.match(dashboard, /const canSubmit = !application \|\| application\.status === "draft" \|\| application\.status === "changes_requested"/);
assert.match(dashboard, /disabled=\{isBusy \|\| !formValid\}/);

console.log("signup first-click submit contract passed");
