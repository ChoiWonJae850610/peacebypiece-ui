#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const rules = read("docs/project/app-v2/09c-codex-testing-contracts-handoff.md");
const runner = read("tools/dev/start-wafl-external-qa.ps1");

for (const token of [
  "WAFL 런타임 준비",
  "DeveloperAutoConnect",
  "Next `3100`",
  "Metro `8081`",
  "current feature's narrow dev/test mutation switch",
  "Quick Tunnel/Funnel absent",
  "Metro advertised host",
  "iOS manifest launch bundle URL host",
  "Windows LAN IPv4 advertisement is a READY failure",
  "Alive Next/Metro/Serve roles alone are not READY",
]) {
  assert.ok(rules.includes(token), `runtime preparation shorthand missing ${token}`);
}

assert.match(runner, /EnableAlpha61MobileWorkOrderCreateMutation/);
assert.match(runner, /WAFL_V2_COMMAND_MUTATION_APPROVED/);
assert.match(runner, /mutationMode = "mobile-work-order-create"/);
assert.match(runner, /DeveloperAutoConnect/);
assert.match(runner, /EXPO_PACKAGER_PROXY_URL = "http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort"/);
assert.match(runner, /REACT_NATIVE_PACKAGER_HOSTNAME = \$state\.tailscaleIpv4/);
assert.match(runner, /manifest\?platform=ios/);
assert.match(runner, /metroAdvertisedHost/);
assert.match(runner, /iosManifestLaunchHost/);
assert.match(runner, /developerClientLaunchHost/);
assert.match(runner, /_expo\/link\?choice=expo-dev-client&platform=ios/);
assert.match(runner, /EXPO_DEVELOPER_AUTOCONNECT_METRO_ADVERTISED_HOST_MISMATCH/);

console.log("WAFL runtime preparation shorthand contract: PASS");
