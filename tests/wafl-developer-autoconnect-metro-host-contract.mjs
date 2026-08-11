#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runner = fs.readFileSync(path.join(root, "tools/dev/start-wafl-external-qa.ps1"), "utf8");

assert.match(runner, /Get-WaflQaTailscaleRuntime/);
assert.match(runner, /\$state\.tailscaleIpv4 = \$tailscaleRuntime\.Ipv4/);
assert.match(runner, /REACT_NATIVE_PACKAGER_HOSTNAME = \$state\.tailscaleIpv4/);
assert.match(runner, /EXPO_PACKAGER_PROXY_URL = "http:\/\/\$\(\$state\.tailscaleIpv4\):\$ExpoPort"/);
assert.match(runner, /"start", "--lan", "--dev-client", "--port"/);
assert.match(runner, /http:\/\/127\.0\.0\.1:\$ExpoPort\/manifest\?platform=ios/);
assert.match(runner, /\$launchUri\.Host -ne \$state\.tailscaleIpv4 -or \$launchUri\.Port -ne \$ExpoPort/);
assert.match(runner, /_expo\/link\?choice=expo-dev-client&platform=ios/);
assert.match(runner, /\$developerClientMetroUri\.Host -ne \$state\.tailscaleIpv4 -or \$developerClientMetroUri\.Port -ne \$ExpoPort/);
assert.match(runner, /EXPO_DEVELOPER_AUTOCONNECT_METRO_ADVERTISED_HOST_MISMATCH/);
assert.match(runner, /EXPO_DEVELOPER_AUTOCONNECT_CLIENT_LAUNCH_HOST_MISMATCH/);
assert.match(runner, /\$state\.metroAdvertisedHost = \$launchUri\.Host/);
assert.match(runner, /\$state\.iosManifestLaunchHost = \$launchUri\.Host/);
assert.match(runner, /\$state\.developerClientLaunchHost = \$developerClientMetroUri\.Host/);
assert.doesNotMatch(runner, /100\.81\.130\.25/);

console.log("WAFL DeveloperAutoConnect Metro advertised-host contract: PASS");
