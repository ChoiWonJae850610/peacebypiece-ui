#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

assert.match(pipeline, /function GetWorkorderSizePdfHandoffEvidence/, "pipeline must collect workorder-size-pdf handoff evidence");
assert.match(pipeline, /OK_Apply_Workorder_Size_Spec_Migration_\$evidenceVersion-\*\.txt/);
assert.match(pipeline, /OK_Workorder_Size_Spec_Post_Apply_Audit_\$evidenceVersion-\*\.txt/);
assert.match(pipeline, /OK_Workorder_Size_Spec_Final_Residual_Audit_\$evidenceVersion-\*\.txt/);
assert.match(pipeline, /if \(\$Version -eq "0\.24\.34\.1"\) \{ "0\.24\.34" \}/, "0.24.34.1 handoff must reuse 0.24.34 workorder migration evidence");
assert.match(pipeline, /DbMigrationApplyResult = if \(\$migrationPassed\) \{ "PASS" \}/);
assert.match(pipeline, /PostApplyAuditResult = if \(\$postApplyPassed\) \{ "PASS" \}/);
assert.match(pipeline, /FinalResidualDbRows = if \(\$residualPassed\) \{ "0" \}/);
assert.match(pipeline, /FinalResidualR2Objects = "NOT_APPLICABLE - no R2 mutation"/);
assert.match(pipeline, /BusinessDataMutation = "false"/);
assert.match(pipeline, /ProductionBusinessDataMutation = "false"/);
assert.match(pipeline, /ProductionMutation = "false"/);
assert.match(pipeline, /SchemaMigrationThisRun = if \(\$migrationPassed\) \{ "patch_0_24_34_workorder_size_spec_and_pdf\.sql" \}/);
assert.match(pipeline, /\$ProfileName -eq "workorder-size-pdf" -or \$ProfileName -eq "public-signup-first-draft-fix"/);
assert.match(pipeline, /function GetDbMigrationAppliedDisplayValue/);
assert.match(pipeline, /true; approved dev\/test only/);
assert.match(pipeline, /function GetDbSchemaMutationDisplayValue/);
assert.match(pipeline, /true; additive migration only on approved dev\/test DB/);

console.log("repo-state workorder size/PDF metadata contract: PASS");
