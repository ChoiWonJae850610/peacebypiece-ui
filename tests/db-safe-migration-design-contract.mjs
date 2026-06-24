import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "docs/project/28-database-source-of-truth-safe-migration-design.md",
  "db/audits/0.24.21.11-reconciliation-readonly.sql",
  "db/audits/0.24.21.11-safe-ddl-draft.sql",
  "lib/internal/roadmap/roadmap-0.24.21.11.ts",
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`missing ${rel}`);
}
const recon = fs.readFileSync(path.join(root, required[1]), "utf8");
if (/\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i.test(recon.replace(/^--.*$/gm, ""))) {
  throw new Error("reconciliation SQL must remain SELECT-only");
}
const ddl = fs.readFileSync(path.join(root, required[2]), "utf8");
for (const line of ddl.split(/\r?\n/)) {
  if (/^\s*(ALTER|CREATE|DROP|UPDATE|INSERT|DELETE|TRUNCATE)\b/i.test(line)) {
    throw new Error(`safe DDL draft contains executable statement: ${line}`);
  }
}
const doc = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of ["Canonical source-of-truth matrix", "reconciliation", "Rollback", "RLS", "0.24.22"]) {
  if (!doc.includes(token)) throw new Error(`missing design token: ${token}`);
}
console.log("db-safe-migration-design-contract: PASS");
