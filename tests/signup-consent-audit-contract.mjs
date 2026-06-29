import assert from "node:assert/strict";
import fs from "node:fs";

const compatibility = fs.readFileSync("db/audits/0.24.26-signup-consents-migration-compatibility-readonly.sql", "utf8");
const postApply = fs.readFileSync("db/audits/0.24.26-signup-consents-post-apply-schema-readonly.sql", "utf8");
const runner = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");
const combined = `${compatibility}\n${postApply}`;

for (const token of [
  "signup-consents-compatibility",
  "0.24.26-signup-consents-migration-compatibility-readonly.sql",
  "signup-consents-post-apply",
  "0.24.26-signup-consents-post-apply-schema-readonly.sql",
  "BEGIN READ ONLY",
  "ROLLBACK",
  "Total compatibility findings",
]) {
  assert.ok(runner.includes(token), `read-only audit runner missing ${token}`);
}

for (const sql of [compatibility, postApply]) {
  const withoutComments = sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(withoutComments, /\b(insert|update|delete|merge|alter|drop|truncate|create|grant|copy|call|do|vacuum|analyze|refresh|reindex|cluster|set)\b/i);
  for (const statement of withoutComments.split(";").map((part) => part.trim()).filter(Boolean)) {
    assert.match(statement, /^(select|with)\b/i, "audit statement must start with SELECT or WITH");
  }
}

for (const token of [
  "signup_application_consents",
  "signup_application_consents_application_idx",
  "signup_application_consents_active_type_unique",
  "public.gen_random_uuid()",
  "signup_applications.id",
  "forbidden_index",
  "signup_application_consents_active_version_unique",
]) {
  assert.ok(combined.includes(token), `signup consent audit missing ${token}`);
}

console.log("signup consent audit contract passed");
