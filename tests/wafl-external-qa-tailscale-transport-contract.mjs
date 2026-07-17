import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const startScript = read("tools/dev/start-wafl-external-qa.ps1");
const commonScript = read("tools/dev/wafl-external-qa-common.ps1");
const rejectScript = path.join(root, "scripts/reject-wafl-expo-tunnel.mjs");

assert.match(startScript, /TAILSCALE_CLI_MISSING/);
assert.match(startScript, /Get-WaflQaTailscaleRuntime/);
assert.match(startScript, /Write-WaflQaFailureHandoff/);
assert.match(commonScript, /TAILSCALE_DISCONNECTED/);
assert.match(commonScript, /TAILSCALE_IPV4_NOT_FOUND/);
assert.equal((startScript.match(/APP_VARIANT/g) ?? []).length, 1);
assert.match(startScript, /if \(\$MobileTransport -eq "TailscaleLan"\) \{\s*\$mobileEnvironment\.APP_VARIANT = "development"\s*\$mobileEnvironment\.EXPO_PACKAGER_PROXY_URL/);
assert.match(startScript, /EXPO_PACKAGER_PROXY_URL = "http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort"/);
assert.match(startScript, /http:\/\/127\.0\.0\.1:\$ExpoPort\/status/);
assert.match(startScript, /http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort\/status/);
assert.doesNotMatch(`${startScript}\n${commonScript}`, /authkey|nodekey|loginurl/i);

const legacy = spawnSync(process.execPath, [rejectScript], { encoding: "utf8" });
assert.equal(legacy.status, 1);
assert.match(legacy.stderr, /WAFL_EXPO_TUNNEL_LEGACY_DISABLED/);
assert.match(legacy.stderr, /TailscaleLan/);

console.log("WAFL external QA legacy rejection / Tailscale CLI missing-disconnected handoff static contract: PASS");
