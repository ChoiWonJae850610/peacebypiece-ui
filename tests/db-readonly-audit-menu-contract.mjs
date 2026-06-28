import fs from 'node:fs';
const ps = fs.readFileSync('tools/pipeline/peacebypiece-auto-pipeline.ps1','utf8');
const runner = fs.readFileSync('scripts/run-readonly-db-audit.mjs','utf8');
for (const item of [
  '30. DB Schema Reconciliation Audit',
  '31. DB Constraint Readiness Check',
  '32. DB Index Usage/Query Readiness Report',
  '42. Signup Migration Compatibility Audit',
  'RunDbSchemaReconciliationAudit',
  'RunDbConstraintReadinessCheck',
  'RunDbIndexReadinessReport',
  'RunSignupMigrationCompatibilityAudit',
  "InvokeReadOnlyDbAudit -Mode 'signup-compatibility'",
  "Title 'Signup Migration Compatibility Audit'",
  "Label 'Signup_Migration_Compatibility_Audit'",
  'TestReadOnlyDbAuditGuard',
  'WAFL_DB_AUDIT_APPROVED = \'1\'',
  'Join-Path (Split-Path -Parent $LogDir) "DB_Audit"',
  '-ResultDirectory $dbAuditLogDir',
]) {
  if (!ps.includes(item)) throw new Error(`missing PowerShell contract: ${item}`);
}
for (const item of [
  "BEGIN READ ONLY",
  "ROLLBACK",
  "WAFL_DB_AUDIT_APPROVED",
  "Forbidden non-read-only SQL token detected",
  "mode === 'constraints'",
  "totalReportedIssues > 0",
  "const findingModes = new Set(['reconciliation', 'signup-compatibility', 'signup-post-apply'])",
  "signup-compatibility",
  "Total compatibility findings",
  "process.exitCode = 0",
]) {
  if (!runner.includes(item)) throw new Error(`missing runner guard: ${item}`);
}
const signupFunction = ps.match(/^function RunSignupMigrationCompatibilityAudit \{[^\n]+\}/m)?.[0] ?? "";
if (!signupFunction) throw new Error("missing RunSignupMigrationCompatibilityAudit function body");
if (!/InvokeReadOnlyDbAudit/.test(signupFunction)) throw new Error("signup audit must reuse InvokeReadOnlyDbAudit");
if (/(patch_0_24_26|psql|run-sql|CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE)/i.test(signupFunction)) {
  throw new Error("signup audit function must not call migration or mutation commands");
}
const invokeReadOnlyDbAudit = ps.match(/function InvokeReadOnlyDbAudit \{[\s\S]*?\n}/)?.[0] ?? "";
if (!invokeReadOnlyDbAudit.includes('DB_Audit')) throw new Error("read-only DB audit logs must use the DB_Audit log folder");
if (invokeReadOnlyDbAudit.includes('Join-Path $NewestResultDIr')) throw new Error("read-only DB audit must not write result logs to 4. Newest");
if (!/^\s*42\s*\{\s*RunSignupMigrationCompatibilityAudit \| Out-Null\s*\}/m.test(ps)) {
  throw new Error("menu 42 must dispatch only RunSignupMigrationCompatibilityAudit");
}
console.log('db-readonly-audit-menu-contract: PASS');
