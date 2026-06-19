import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/simulator/commands/db-data.mjs", import.meta.url), "utf8");
assert.match(source, /DELETE FROM company_users[\s\S]*company_id = \$2[\s\S]*user_id = \$3[\s\S]*id <> \$1/);
assert.match(source, /ON CONFLICT \(id\) DO UPDATE SET[\s\S]*role=EXCLUDED\.role/);
assert.doesNotMatch(source, /ON CONFLICT \(company_id,user_id,role\) DO UPDATE SET/);
console.log("PASS simulator company_users idempotent upsert contract");
