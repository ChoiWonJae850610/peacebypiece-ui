import assert from "node:assert/strict";
import fs from "node:fs";

const audit = fs.readFileSync("db/audits/0.24.26-signup-migration-compatibility-readonly.sql", "utf8");

const publicNamespaceCount = (audit.match(/public_namespace AS/g) ?? []).length;
assert.ok(publicNamespaceCount >= 4, "each relation audit section should define public namespace scope");

for (const token of [
  "WHERE nspname = 'public'",
  "public_relation.relnamespace = public_namespace.oid",
  "columns.table_schema = 'public'",
  "missing_table",
  "not_table",
  "missing_id_column",
  "id_type_drift",
]) {
  assert.ok(audit.includes(token), `public schema isolation missing ${token}`);
}

assert.doesNotMatch(audit, /pg_class\.relname = expected_tables\.table_name\s+AND pg_class\.relkind/);
assert.doesNotMatch(audit, /LEFT JOIN pg_namespace[\s\S]{0,120}pg_namespace\.nspname = 'public'/);

console.log("signup read-only audit public schema contract passed");
