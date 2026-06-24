import fs from 'node:fs';
const ps = fs.readFileSync('tools/pipeline/peacebypiece-auto-pipeline.ps1','utf8');
const runner = fs.readFileSync('scripts/run-readonly-db-audit.mjs','utf8');
for (const item of ['30. DB Schema Reconciliation Audit','31. DB Constraint Readiness Check','32. DB Index Usage/Query Readiness Report','RunDbSchemaReconciliationAudit','RunDbConstraintReadinessCheck','RunDbIndexReadinessReport']) {
  if (!ps.includes(item)) throw new Error(`missing PowerShell contract: ${item}`);
}
for (const item of ['BEGIN READ ONLY','WAFL_DB_AUDIT_APPROVED','Forbidden non-read-only SQL token detected']) {
  if (!runner.includes(item)) throw new Error(`missing runner guard: ${item}`);
}
console.log('db-readonly-audit-menu-contract: PASS');
