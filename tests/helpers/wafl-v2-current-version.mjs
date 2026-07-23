import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));

function readExportedVersion(relativePath, exportName) {
  const source = read(relativePath);
  const match = source.match(new RegExp(`export const ${exportName} = "([^"]+)"`));
  assert.ok(match, `${exportName} must be exported by ${relativePath}`);
  return match[1];
}

export function assertCanonicalWaflVersionConsistency() {
  const canonicalVersion = readExportedVersion("lib/constants/version.ts", "APP_VERSION");
  const mobileVersion = readExportedVersion("apps/mobile/constants/version.ts", "MOBILE_APP_VERSION");
  const mobilePackage = readJson("apps/mobile/package.json");
  const mobileLock = readJson("apps/mobile/package-lock.json");
  const appConfig = readJson("apps/mobile/app.json");
  const currentState = read("docs/codex-current-state.md");
  const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");

  assert.match(canonicalVersion, /^2\.0\.0-alpha\.\d+$/, "canonical APP_VERSION must be an alpha version");
  assert.equal(mobileVersion, canonicalVersion, "mobile constant must match canonical APP_VERSION");
  assert.equal(mobilePackage.version, canonicalVersion, "mobile package version must match canonical APP_VERSION");
  assert.equal(mobileLock.version, canonicalVersion, "mobile lock version must match canonical APP_VERSION");
  assert.equal(mobileLock.packages[""].version, canonicalVersion, "mobile lock root package must match canonical APP_VERSION");
  assert.equal(appConfig.expo.extra.appVersion, canonicalVersion, "Expo extra appVersion must match canonical APP_VERSION");
  assert.equal(appConfig.expo.version, canonicalVersion.split("-")[0], "Expo public version must match canonical public version");
  assert.ok(currentState.includes(`Result version: \`${canonicalVersion}\``), "Current Baseline must match canonical APP_VERSION");
  assert.ok(roadmap.includes(`Current result — ${canonicalVersion}`), "roadmap current result must match canonical APP_VERSION");

  return canonicalVersion;
}

export function nextWaflAlphaVersion(version) {
  const match = version.match(/^(2\.0\.0-alpha\.)(\d+)$/);
  assert.ok(match, `cannot derive next alpha version from ${version}`);
  return `${match[1]}${Number(match[2]) + 1}`;
}
