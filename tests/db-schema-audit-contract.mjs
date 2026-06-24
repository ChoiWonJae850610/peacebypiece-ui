import fs from "node:fs";

const audit = fs.readFileSync("docs/project/27-database-schema-query-permission-audit.md", "utf8");
const schema = fs.readFileSync("db/schema/full_reset.sql", "utf8");
const tableCount = [...schema.matchAll(/CREATE TABLE\s+\w+\s*\(/gi)].length;
const indexCount = [...schema.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX/gi)].length;

const required = [
  "Tables: 60",
  "Explicit indexes: 193",
  "User and membership source-of-truth overlap",
  "Billing and plan source-of-truth overlap",
  "Application-only tenant isolation",
  "0.24.21.11 required deliverables",
  "No table in this list is approved for deletion",
];

if (tableCount !== 60) throw new Error(`Expected 60 tables, found ${tableCount}`);
if (indexCount !== 193) throw new Error(`Expected 193 indexes, found ${indexCount}`);
for (const text of required) {
  if (!audit.includes(text)) throw new Error(`Missing audit contract text: ${text}`);
}

console.log("db-schema-audit-contract: PASS");
