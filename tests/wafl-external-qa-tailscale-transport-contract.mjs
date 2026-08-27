import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const startScript = read("tools/dev/start-wafl-external-qa.ps1");
const commonScript = read("tools/dev/wafl-external-qa-common.ps1");
const statusScript = read("tools/dev/status-wafl-external-qa.ps1");
const rejectScript = path.join(root, "scripts/reject-wafl-expo-tunnel.mjs");

assert.match(startScript, /TAILSCALE_CLI_MISSING/);
assert.match(startScript, /Get-WaflQaTailscaleRuntime/);
assert.match(startScript, /Write-WaflQaFailureHandoff/);
assert.match(commonScript, /TAILSCALE_DISCONNECTED/);
assert.match(commonScript, /TAILSCALE_IPV4_NOT_FOUND/);
assert.equal((startScript.match(/APP_VARIANT/g) ?? []).length, 1);
assert.match(startScript, /if \(\$MobileTransport -in @\("TailscaleLan", "DeveloperAutoConnect"\)\) \{\s*\$mobileEnvironment\.APP_VARIANT = "development"\s*[\s\S]*?\$mobileEnvironment\.REACT_NATIVE_PACKAGER_HOSTNAME = \$state\.tailscaleIpv4\s*\$mobileEnvironment\.EXPO_PACKAGER_PROXY_URL/);
assert.match(startScript, /EXPO_PACKAGER_PROXY_URL = "http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort"/);
assert.match(startScript, /http:\/\/127\.0\.0\.1:\$ExpoPort\/status/);
assert.match(startScript, /http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort\/status/);
assert.match(startScript, /Test-WaflQaReadApiTarget/);
assert.match(startScript, /GetSha256HexPrefix/);
assert.match(startScript, /readApiGuard = "ready"/);
assert.match(startScript, /fingerprintVerified = \$true/);
assert.match(startScript, /Resolve-WaflQaCanonicalNodeToolchain/);
assert.match(startScript, /Ensure-WaflQaMetroFirewallRule/);
assert.match(startScript, /"start", "--clear", "--lan", "--dev-client"/);
assert.match(startScript, /expoReadyDeadline = \[DateTime\]::UtcNow\.AddSeconds\(180\)/);
assert.match(statusScript, /ContainsKey\('tailscale-serve'\)/);
assert.match(startScript, /DATABASE_URL = \$readApiTarget\.DatabaseUrl/);
assert.match(startScript, /serverEnvironmentContractReady/);
assert.match(startScript, /Invoke-WaflQaBundleTransfer/);
assert.match(startScript, /Invoke-WaflQaDeveloperReadSmoke/);
assert.match(startScript, /developer-auth-company-workorder-read-ready/);
assert.match(startScript, /makerQaProfile -eq "alpha67-current-maker"/);
assert.match(startScript, /mutationMode -eq "current-maker-alpha67"/);
assert.doesNotMatch(startScript, /makerQaProfile -in @\("alpha64-current-maker", "alpha65-current-maker", "alpha67-current-maker"\)/);
for (const name of [
  "WAFL_V2_READ_API_ENABLED",
  "WAFL_V2_READ_APPROVED",
  "WAFL_V2_RUNTIME",
  "WAFL_V2_TEST_PREFIX",
  "WAFL_V2_APPROVED_DB_FINGERPRINT",
]) assert.ok((startScript.match(new RegExp(name, "g")) ?? []).length >= 1, `${name} must be present in the Next contract`);
assert.doesNotMatch(startScript.slice(startScript.indexOf("$mobileEnvironment = @{")), /WAFL_V2_(?:READ|RUNTIME|TEST_PREFIX|APPROVED_DB_FINGERPRINT)/);
assert.match(statusScript, /Read API guard:/);
assert.match(statusScript, /DB fingerprint verified:/);
assert.match(statusScript, /Invoke-WaflQaDeveloperReadSmoke/);
assert.match(statusScript, /Test-WaflQaMetroFirewallRule/);
assert.match(statusScript, /ERR_STREAM_UNABLE_TO_PIPE/);
assert.match(statusScript, /Unable to deserialize cloned data/);
assert.match(statusScript, /makerQaProfile -eq "alpha67-current-maker"/);
assert.match(statusScript, /Metro stream healthy:/);
assert.match(statusScript, /WorkOrder list read:/);
assert.match(statusScript, /WorkOrder read target:/);
assert.match(statusScript, /Runtime canonical READY:/);
assert.match(commonScript, /Get-WaflQaPort3000ListenerPolicy/);
assert.match(commonScript, /Get-WaflQaCloudflaredProcessPolicy/);
const currentListTargetIndex = commonScript.indexOf('$result.OwnerFixtureSource = "current-company-list"');
const legacyFixtureIndex = commonScript.indexOf("$fixture = Resolve-WaflQaOwnerFixture");
assert.ok(currentListTargetIndex >= 0 && currentListTargetIndex < legacyFixtureIndex);
assert.match(statusScript, /WAFL-owned port 3000 clear:/);
assert.match(statusScript, /VerifiedUnrelatedCount/);
assert.match(statusScript, /Cloudflared provenance:/);
assert.match(commonScript, /live-ingress-targets-wafl-runtime/);
assert.doesNotMatch(statusScript, /\$port3000Listener\.Count -eq 0/);
assert.doesNotMatch(statusScript, /Get-Process -Name cloudflared[^\n]+Count -eq 0/);
assert.doesNotMatch(`${startScript}\n${commonScript}`, /authkey|nodekey|loginurl/i);

const legacy = spawnSync(process.execPath, [rejectScript], { encoding: "utf8" });
assert.equal(legacy.status, 1);
assert.match(legacy.stderr, /WAFL_EXPO_TUNNEL_LEGACY_DISABLED/);
assert.match(legacy.stderr, /TailscaleLan/);

console.log("WAFL external QA legacy rejection / Tailscale CLI missing-disconnected handoff static contract: PASS");
