#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const stop = read("tools/dev/stop-wafl-external-qa.ps1");
const runtime = read("scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs");

assert.match(runner, /\[ValidateSet\("external-device", "memo-ime-display", "accessory-lifecycle-parity", "work-order-image"\)\]/);
assert.match(runner, /\$internalMemoImeMode = \$RuntimeQaMode -eq "memo-ime-display"/);
assert.match(runner, /MEMO_IME_DISPLAY_REQUIRES_DEVELOPER_AUTO_CONNECT/);
assert.match(runner, /MEMO_IME_DISPLAY_REQUIRES_ALPHA55_MUTATION_MODE/);
assert.match(runner, /MEMO_IME_DISPLAY_REQUIRES_CANONICAL_PORTS/);
assert.match(runner, /\$usesTailscaleServeOrigin = \$internalRuntimeMode -or \$MobileTransport -eq "DeveloperAutoConnect"/);
assert.match(runner, /\$cloudflared = if \(\$usesTailscaleServeOrigin\) \{ \$null \}/);
assert.match(runner, /previewTransport = \$\(if \(\$usesTailscaleServeOrigin\)/);
assert.match(runner, /"tailscale-serve-internal" \} else \{ "cloudflare-quick-tunnel"/);
assert.match(runner, /else \{[\s\S]*?Start-WaflQaOwnedProcess -Role "cloudflared"/);
assert.match(runner, /RuntimeQaMode = "external-device"/);
assert.doesNotMatch(`${runner}\n${runtime}`, /stop-wafl-external-qa\.ps1\s+-StatusOnly/);
assert.doesNotMatch(stop, /\[switch\]\$StatusOnly/);

for (const mode of [
  "material-order-lifecycle",
  "zero-order",
  "unit-layout-create",
  "header-layout-readonly",
  "create-only-recovery",
  "memo-ime-display",
]) {
  assert.match(runtime, new RegExp(`"${mode}"`), `runtime mode missing: ${mode}`);
}
assert.match(runtime, /function resolveRuntimeQaMode\(argv\)/);
assert.match(runtime, /unsupported-runtime-qa-mode/);
assert.match(runtime, /async function runMemoImeDisplay\(\)/);
assert.match(runtime, /ALPHA55_AUTO_MEMO_IME_DISPLAY/);
assert.match(runtime, /assertMemoImeStartingBaseline\(before\)/);
assert.ok(
  runtime.indexOf("assertMemoImeStartingBaseline(before)") <
    runtime.indexOf('command: "fixture-create"'),
  "baseline guard must run before the first write",
);
assert.match(runtime, /memo-ime-marker-must-not-preexist/);
assert.match(runtime, /memo-ime-approved-supplier-missing/);
assert.match(runtime, /const runtimeBaseUrl = `http:\/\/127\.0\.0\.1:\$\{state\.nextPort\}`/);
assert.match(runtime, /cookie = createReadOnlySessionCookie\(before\.sessionTarget\)/);
assert.match(runtime, /requestSave\(\), false, "memo-ime-duplicate-check-must-be-ignored"/);
assert.match(runtime, /filter\(\(record\) => record\.command === "memo-patch"\)\.length, 1/);
assert.match(runtime, /duplicateAutomaticUnknownMutation: 0/);
assert.match(runtime, /legacyCancelledUnchanged: true/);
assert.match(runtime, /legacyFingerprint/);
assert.match(runtime, /"fixture-create",[\s\S]*?"request",[\s\S]*?"cancel",[\s\S]*?"memo-patch",[\s\S]*?"re-request"/);
assert.match(runtime, /\["requested", false, true\]/);
assert.match(runtime, /createMaterialHeaderPresentation/);
assert.match(runtime, /badgeOrder: header\.badgeCluster\.map/);
assert.match(runtime, /formatQuantityParts\("2", "yd"\)/);
assert.match(runtime, /createMaterialMemoDisclosureModel\(3, false\)/);
assert.match(runtime, /createMaterialMemoDisclosureModel\(3, true\)/);

const invalid = spawnSync(
  process.execPath,
  ["scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs", "--mode", "invalid-mode"],
  { cwd: root, encoding: "utf8" },
);
assert.notEqual(invalid.status, 0);
assert.match(`${invalid.stdout}\n${invalid.stderr}`, /unsupported-runtime-qa-mode:invalid-mode/);

console.log("PASS workorder-v2-alpha55-memo-ime-runtime-mode-contract");
