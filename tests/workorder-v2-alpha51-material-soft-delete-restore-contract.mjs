#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import {
  assertCanonicalWaflVersionConsistency,
  nextWaflAlphaVersion,
} from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

const migration = read("db/v2/migrations/013_v2_material_line_archive_lifecycle.sql");
const repository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const service = read("lib/domain/work-orders/command/materialCommandService.ts");
const validation = read("lib/domain/work-orders/command/materialValidation.ts");
const detailService = read("lib/domain/work-orders/read/detailService.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const listRepository = read("lib/domain/work-orders/read/listRepository.ts");
const issueRepository = read("lib/domain/work-orders/command/issueRepository.ts");
const previewRepository = read("lib/domain/work-orders/read/previewRepository.ts");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const draftExitPolicy = read("apps/mobile/application/draftExitPolicy.ts");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const start = read("tools/dev/start-wafl-external-qa.ps1");
const migrationRunner = read("scripts/run-wafl-v2-alpha51-material-lifecycle-migration.mjs");
const appliedMigrations = read("tools/pipeline/approved-applied-migrations.psd1");
const evidence = read("docs/project/app-v2/50-mobile-material-soft-delete-restore-lifecycle-evidence.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const archiveRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/archive/route.ts");
const restoreRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/restore/route.ts");
const lineRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/route.ts");

const canonicalVersion = assertCanonicalWaflVersionConsistency();

assert.match(migration, /APPROVED ALPHA\.51 DEV\/TEST GATE/);
assert.match(migration, /ADD COLUMN archived_at timestamptz/);
assert.match(migration, /ADD COLUMN archived_by_member_id text/);
assert.match(migration, /archived_at IS NULL/);
assert.match(migration, /archived_at IS NOT NULL/);
assert.match(migration, /FOREIGN KEY \(company_id, archived_by_member_id\)/);
assert.match(migration, /WHERE archived_at IS NULL/);
assert.match(migration, /WHERE archived_at IS NOT NULL/);
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b|DROP TABLE|TRUNCATE/);
assert.match(migrationRunner, /ALPHA51_MIGRATION_013_APPLY_PASS/);
assert.match(migrationRunner, /ALPHA51_MIGRATION_013_READ_ONLY_AUDIT_PASS/);
assert.match(migrationRunner, /businessMutation: false/);
assert.match(appliedMigrations, /Alpha51Migration013/);
assert.match(appliedMigrations, /ExpectedLedgerCount = 13/);

assert.match(archiveRoute, /export async function POST/);
assert.match(restoreRoute, /export async function POST/);
assert.match(archiveRoute, /"archive"/);
assert.match(restoreRoute, /"restore"/);
assert.doesNotMatch(archiveRoute + restoreRoute + lineRoute, /export async function DELETE/);
assert.match(validation, /validateMaterialLifecycleTransition/);
assert.match(validation, /clientRequestId/);
assert.match(validation, /expectedVersion/);
assert.match(service, /transitionMaterialLifecycle/);
assert.match(service, /requireMaterialDraftMutationApproval\(\)/);
assert.match(repository, /MATERIAL_ARCHIVE_COMMAND_CODE/);
assert.match(repository, /MATERIAL_RESTORE_COMMAND_CODE/);
assert.match(repository, /target\.material_status !== "editing"/);
assert.match(repository, /assertCurrentDraft\(target, input\.expectedVersion\)/);
assert.match(repository, /archived_by_member_id = CASE WHEN \$4 = 'archive'/);
assert.match(repository, /entity_version = entity_version \+ 1/);
assert.match(repository, /recalculateMaterialTotals: true/);
assert.match(repository, /completeReceipt/);
assert.match(repository, /appendMaterialEvent/);
assert.match(repository, /throw new MaterialCommandRepositoryError\("conflict"/);
assert.doesNotMatch(repository, /DELETE FROM work_order_material_lines/);

assert.match(detailService, /lifecycle !== "active" && lifecycle !== "archived"/);
assert.match(detailService, /new Set\(\["type", "lifecycle", "limit", "cursor"\]\)/);
assert.match(detailService, /searchParams\.get\("lifecycle"\) \?\? "active"/);
assert.match(detailService, /seen\.has\(key\)/);
assert.match(detailService, /code: "VALIDATION_ERROR", status: 400/);
assert.match(detailService, /searchParams\.get\("type"\)/);
assert.match(detailService, /parseLimit\(input\.searchParams\.get\("limit"\)\)/);
assert.match(detailService, /input\.searchParams\.get\("cursor"\)/);
assert.match(detailRepository, /m\.archived_at IS NULL/);
assert.match(detailRepository, /m\.archived_at IS NOT NULL/);
assert.match(detailRepository, /input\.lifecycle === "active"/);
assert.match(detailRepository, /input\.lifecycle === "archived"/);
assert.match(detailRepository, /lifecycle: input\.lifecycle/);
assert.match(detailRepository, /totalCount/);
assert.match(listRepository, /m\.archived_at IS NULL/);
assert.match(issueRepository, /m\.archived_at IS NULL/);
assert.match(previewRepository, /m\.archived_at IS NULL/);
assert.match(repository, /WHERE company_id = \$1 AND revision_id = \$4::uuid AND archived_at IS NULL/);

assert.match(apiClient, /export function archiveWorkOrderMaterial/);
assert.match(apiClient, /export function restoreWorkOrderMaterial/);
assert.match(apiClient, /lifecycle: "active" \| "archived"/);
assert.match(apiClient, /method: "POST"/);
assert.doesNotMatch(apiClient, /method: "DELETE"/);
assert.match(app, /requestArchiveMaterial/);
assert.match(app, /requestRestoreMaterial/);
assert.match(app, /decideDraftExit/);
assert.match(draftExitPolicy, /mutationInFlight[\s\S]*return "blocked-saving"/);
assert.match(draftExitPolicy, /return "discard"/);
assert.match(app, /workOrderQueryController\.materials\(currentDetail\.header\.id, null, "active"\)/);
assert.match(app, /workOrderQueryController\.materials\(currentDetail\.header\.id, null, "archived"\)/);
assert.match(app, /materialLifecycleMutation\.inFlight/);
assert.doesNotMatch(app, /setInterval|automaticSave|autoSave/);
assert.match(materials, /삭제된 원단 \{archivedTotalCount\}개/);
assert.match(materials, /다시 복구할 수 있습니다|삭제된 원단으로 이동/);
assert.match(materials, /accessibilityLabel=\{`\$\{line\.name\} 복구`\}/);
assert.match(materials, /onRestore/);
assert.match(materials, /archivedExpanded/);

const workOrderId = "11111111-1111-1111-1111-111111111111";
const materialLineId = "22222222-2222-2222-2222-222222222222";
const env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.51-dev-test-mobile-material-lifecycle-runtime",
};
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials`, "GET", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/archive`, "POST", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/restore`, "POST", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}`, "DELETE", env), false);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/order-request`, "POST", env), false);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/archive`, "POST", { ...env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
assert.match(start, /EnableAlpha51MaterialLifecycleMutation/);
assert.match(start, /mutationMode = "material-archive-restore"/);
assert.match(evidence, /ALPHA51_MOBILE_MATERIAL_SOFT_DELETE_RESTORE_LIFECYCLE_COMPLETE/);
assert.match(evidence, /archive success \| 2/);
assert.match(evidence, /restore success \| 2/);
assert.match(evidence, /material row delta \| 0/);
assert.ok(roadmap.includes(`Next candidate — ${nextWaflAlphaVersion(canonicalVersion)}`));

console.log("workorder v2 alpha.51 material soft-delete restore lifecycle contract: PASS");
