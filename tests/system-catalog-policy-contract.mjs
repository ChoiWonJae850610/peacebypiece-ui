import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = readFileSync("lib/catalog/systemCatalogPolicy.ts", "utf8");

assert.match(policy, /SYSTEM_CATALOG_VERSION_CODE = "wafl-system-catalog-2026-0\.24\.27"/);
assert.match(policy, /type SystemCatalogDomain = "apparel" \| "underwear" \| "accessory"/);

const categoryCodes = Array.from(policy.matchAll(/code: "([^"]+)"/g), (match) => match[1]).filter(
  (code) => code.includes(".") && !code.includes(":"),
);
assert.equal(new Set(categoryCodes).size, categoryCodes.length, "system catalog category codes must be unique");
assert.ok(categoryCodes.some((code) => code.startsWith("apparel.")), "apparel categories are required");
assert.ok(categoryCodes.some((code) => code.startsWith("underwear.")), "underwear categories are required");
assert.ok(categoryCodes.some((code) => code.startsWith("accessory.")), "accessory categories are required");

assert.match(
  policy,
  /code: "apparel\.top"\s*,[\s\S]*?defaultEnabled: apparelEnabled/,
  "core apparel categories must be enabled by default",
);
assert.match(
  policy,
  /code: "underwear\.bra"\s*,[\s\S]*?defaultEnabled: optionalDisabled/,
  "underwear must be present but disabled by default",
);
assert.match(
  policy,
  /code: "accessory\.bag"\s*,[\s\S]*?defaultEnabled: optionalDisabled/,
  "accessory must be present but disabled by default",
);

for (const expectedSize of ["alpha_xs_xl", "women_55_77", "men_90_105", "free"]) {
  assert.match(policy, new RegExp(`code: "${expectedSize}"`), `missing size set ${expectedSize}`);
}

for (const expectedPom of ["body_length", "shoulder_width", "chest_width", "waist_width", "sleeve_length"]) {
  assert.match(policy, new RegExp(`code: "${expectedPom}"`), `missing POM ${expectedPom}`);
}

for (const forbidden of ["alias", "backfillExistingCompanies", "autoBackfill"]) {
  assert.doesNotMatch(policy, new RegExp(forbidden, "i"), `policy must not introduce ${forbidden}`);
}

console.log("system-catalog-policy-contract: PASS");
