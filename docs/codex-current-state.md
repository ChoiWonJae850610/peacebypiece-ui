# Codex Current State — 0.24.21.10

## 현재 작업 기준

- 현재 버전: `0.24.21.10`
- 다음 버전: `0.24.21.11`
- 다음 작업: 전체 DB source-of-truth, safe constraint/index, migration/dry-run/rollback 설계를 0.24.21.11에서 확정
- 먼저 읽기: `docs/project/23-codex-productization-sprint-master-pack.md`와 해당 Sprint의 canonical 명세
- 사용자 결정 대기 정책은 구현 범위에서 제외한다.




## 0.24.21.10 Database Audit

- `docs/project/27-database-schema-query-permission-audit.md`가 전체 DB schema/query/permission read-only 감사 기준이다.
- 현재 schema inventory는 60 tables, 193 explicit indexes, 2 views다.
- 최고 위험은 users/company_users/company_members, legacy/template permissions, companies/subscriptions/plans/assignments의 중복 source of truth다.
- repository schema에는 RLS DDL이 없으므로 deployed DB 정책을 별도 확인해야 한다.
- 0.24.21.10은 SQL/DB/R2를 실행하거나 변경하지 않는다.
- 0.24.21.11에서 reconciliation SQL, source-of-truth matrix, safe migration/rollback, query-backed index proposal을 작성한다.
- 0.24.22 Codex Sprint A actual implementation boundary는 유지한다.

## 0.24.21.9 Canonical Policy and Master TODO

- `docs/project/26-final-policy-decisions-and-master-todo.md`가 2026-06-24 이후 제품 정책과 전체 TODO의 최신 canonical 기준이다.
- 가입·Trial·결제 실패·해지·삭제, 로그 보존, opaque workorder URL, PDF lifecycle, WAFL 브랜드/도메인/가격, 시스템 기본 분류·사이즈 스펙 결정을 반영한다.
- 기존 `docs/project/19`~`23`의 provisional 문구가 26번 문서와 충돌하면 26번 문서를 우선한다.
- 다음 실제 구현 버전은 `0.24.22`이며 Sprint A Productization UI Foundation부터 진행한다.
- 사업자등록 후 PG 선정, 속옷·액세서리 기본 분류, analytics/cookie, Instagram 홍보 콘텐츠는 TODO로 유지한다.

## Start Manifest

- Current result version: `0.24.20`
- Baseline before this version: `0.24.19`
- APP_VERSION source: `lib/constants/version.ts`
- Current work version: `0.24.20`
- Current work title: `Release Engineering and QA Standards`
- Current branch policy: `master`, `origin/master` synchronized before automatic Finish
- Vercel policy before 1.0: QA deployment, not customer production
- DB migration: none for 0.24.20
- R2/DB execute: not allowed without separate explicit approval

Use this file as the first routing manifest only. For detailed rules, read the target files below instead of re-reading the whole repository.

## Read First By Work Type

| Work type | 먼저 읽을 파일 | 기본으로 읽지 않아도 되는 파일 |
| --- | --- | --- |
| Docs / folder cleanup | `lib/internal/roadmap/roadmap-0.24.13.ts`, `docs/README.md`, `docs/현재기준/document-management.md`, `docs/audits/document-structure-cleanup-0.24.13.md` | product feature source files unless referenced by changed docs |
| Functions next work | `lib/internal/roadmap/roadmap-0.24.14.ts`, `lib/functions/catalog.ts`, `app/functions/FunctionsCatalogClient.tsx`, `tools/pipeline/verify-safe.ps1`, `tools/pipeline/approved-workflow.ps1`, `tests/functions-automation-coverage-contract.mjs` | archived completed-feature history unless investigating a regression |
| Simulator / Functions / QA | `lib/internal/roadmap/index.ts`, `tools/simulator/README.md`, `tools/pipeline/README.md`, `lib/functions/catalog.ts` | completed feature history and archived QA logs |
| Pipeline / Git finish | `tools/pipeline/README.md`, `tools/pipeline/approved-workflow.ps1`, `tools/pipeline/verify-safe.ps1`, `tools/pipeline/finish-version.ps1` | UI component docs unless profile touches UI |
| Docs cleanup / Codex optimization | `docs/README.md`, this file, `docs/productization-roadmap.md`, `tools/pipeline/README.md` | product feature source files unless referenced by changed docs |
| Productization audit | `lib/internal/roadmap/roadmap-0.24.15.ts`, `docs/audits/productization-audit-report-0.24.15.md`, `docs/productization-backlog.md`, `docs/productization-roadmap.md` | archived completed-feature history unless investigating a regression |
| Release / QA planning | `docs/project/12-release-engineering.md`, `docs/project/13-qa-matrix.md`, `docs/project/14-playwright-plan.md`, `docs/project/15-browser-device-matrix.md` | archived QA history unless investigating a regression |
| Customer signup / consent / approval | `docs/project/20-customer-signup-consent-approval-trial-spec.md`, `docs/정책문서/`, `docs/project/19-system-default-catalog-and-seed-spec.md` | archived signup notes unless investigating a conflict |
| Public website / commercial onboarding | `docs/project/21-public-website-commercial-onboarding-spec.md`, `docs/project/20-customer-signup-consent-approval-trial-spec.md`, `docs/정책문서/` | internal system-admin implementation unless boundary verification is required |
| UI / routing remediation | `docs/project/22-ui-routing-remediation-spec.md`, storage/file foundation docs, workorder route source and contracts | archived visual history unless investigating regression |

## Default Search Exclusions

When searching for current implementation, exclude these unless the task is explicitly historical/audit cleanup:

- `docs/보관문서/**`
- `docs/**/legacy/**`
- `docs/**/deprecated/**`
- `node_modules/**`
- `.next/**`
- `artifacts/**`
- `.tmp/**`
- `test-results/**`
- `playwright-report/**`

Prefer current canonical sources over archived notes:

1. local Git state
2. `lib/internal/roadmap/*`
3. this `docs/codex-current-state.md`
4. `docs/현재기준/*`
5. archived/historical docs


## 0.24.21.3 Applied Scope

- `docs/project/21-public-website-commercial-onboarding-spec.md`가 public website와 상업 onboarding의 canonical 입력이다.
- Home, Features, Pricing, Guide, Security, Terms, Signup, Login 사이트맵과 CTA 역할을 확정한다.
- `wafl.co.kr`, `app.wafl.co.kr`, 비공개 system-admin host의 권장 경계를 정의한다.
- Trial 7일, 100MB, 멤버 3명과 기존 요금제·quota 정책을 public pricing 표현과 연결한다.
- 제품 캡처는 demo fixture만 사용하고 실제 고객 데이터, 내부 route, system-admin 정보는 공개하지 않는다.
- public UI, 도메인 구매/DNS, 가입 API/UI, PG/결제, analytics SDK, production 배포는 포함하지 않는다.
- Next GPT documentation target is 0.24.21.4 UI and routing remediation specification.

## 0.24.21.2 Applied Scope

- 공개 홈페이지 가입 요청부터 시스템 관리자 승인까지 상태 계약을 확정한다.
- 필수/선택 정책 동의와 문서 version/hash/timestamp evidence를 분리한다.
- 승인 후 회사, 최초 관리자, Trial 7일, 100MB quota, 멤버 3명 제한, 기본 catalog provisioning 순서를 정의한다.
- provisioning 실패와 idempotent retry, 민감 파일 접근 감사 기준을 포함한다.
- 실제 공개 홈페이지, 가입 API/UI, DB schema/migration, PG/결제, DB/R2 실행은 포함하지 않는다.
- 0.24.21.3에서 public website and commercial onboarding information architecture를 완료했다.


## 0.24.21.4 UI and Routing Remediation Contract

- `docs/project/22-ui-routing-remediation-spec.md` is the canonical input for storage cylinder, company file fields, and workorder routing cleanup.
- Storage usage keeps the existing quota source and presents normal, 80% warning, 100% upload-blocked, error, stale, and over-quota states.
- Representative image and business registration fields show the resource name once; badges express only registration/review state.
- Workorder detail routes should use a stable opaque public identifier rather than sequential ids or transient page/index query state.
- Opaque identifiers do not replace session, tenant, role, permission, or resource-state authorization.
- If implementation requires DB schema, migration, backfill, old-link breakage, or production mutation, Codex must stop for explicit approval.
- No UI, route, DB, R2, Seed, Reset, Cleanup, or Migration implementation is included in 0.24.21.4.
- 0.24.21.5에서 Codex Sprint Master Pack 통합을 완료했다.


## 0.24.13 Applied Scope

- `APP_VERSION` moves to `0.24.13`.
- Document entry points are clarified through `docs/README.md`, `docs/codex-current-state.md`, and `docs/현재기준/document-management.md`.
- Historical and archived documents remain searchable only when explicitly needed; they are not default context.
- Vercel before 1.0 is documented as QA deployment, so commit/push is required before iPad/mobile real-device verification.
- No feature source, DB, R2, Seed, Reset, Cleanup, or Migration execution is included.

## 0.24.12 Applied Scope

- `/worker` now uses the same fixed workspace shell boundary as `/workspace/workorders`.
- `/workspace/workorders` and `/workspace/material-orders` continue to use `WorkspacePageShell` with `contentMode="fixed-md"` and `hideTopbar`.
- Workorder and material-order responsive behavior is fixed by the shared `resolveWorkspaceLayout` policy:
  - desktop and wide landscape tablet: `threePanel`
  - compact landscape tablet: `tabletTwoPanel`
  - mobile and portrait tablet: `drawer`
- Workorder save protection remains in `workspaceWriteLockRef`.
- Material-order save protection remains in `useMaterialOrderFeedback` and `materialOrderMutationLocked`.
- Codex Optimization Phase 1 is included only as document routing and profile guidance. No large file refactor, dev/test-console feature, DB/R2 execute, or PowerShell large refactor is included.

## Pipeline Verify Profile

| Changed file type | Preferred profile | Notes |
| --- | --- | --- |
| Workspace/worker shell, layout policy, save feedback contract | `workspace-commonization` | 0.24.12 profile. Includes build, mutation audit, roadmap contract, approved workflow contract, workspace commonization contract. |
| Roadmap data/page only | `roadmap-development-contract` | Read-only roadmap contract and handoff contract. |
| System-admin internal routes | `system-admin-internal-access` | `/id-control`, `/roadmap`, `/ui`, `/functions` access guard. |
| Pipeline wrapper only | `automation-infrastructure` | Approved workflow and repo-state publication contracts. |
| Docs cleanup only | `repository-cleanup` | Use only when no product behavior changes. 0.24.13 document structure cleanup belongs here. |
| System storage usage | `system-admin-storage` | Storage usage DB metadata and system dashboard contracts. |

Use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
```

## Safety Boundaries

- Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by `NODE_ENV`, `VERCEL_ENV`, `NEXT_PUBLIC_APP_RUNTIME_MODE`, or `WAFL_ENABLE_DEV_TEST_CONSOLE`.
- `/id-control` test account switching is allowed for active `system_admin` with allowlisted targets, signed cookie, original-user match, and audit logs.
- Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.
- Production DB/R2 access remains forbidden.
- Seed, Reset, Cleanup, Migration, destructive SQL, and R2 mutation require separate explicit approval.
- DB Migration is not part of 0.24.12.
- PDF/R2 policy work moves to 0.24.13.
- UI/responsive completion still requires user manual confirmation before the roadmap item can be marked completed.

## Current Verification Target

Recommended profile for this version:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Handoff
```

Because 0.24.12 includes UI/responsive behavior, stop before automatic commit/push unless the user manually confirms the responsive result.



## 0.24.16 Codex/GPT Productization Operating Context

- 0.24.16 establishes the committed operating context for future Codex and ChatGPT productization sprints.
- Canonical project context files are under `docs/project/`.
- Codex must read `AGENTS.md`, this current-state file, `docs/project/01-codex-context.md`, `docs/project/02-project-decisions.md`, `docs/project/03-productization.md`, `docs/project/04-release-checklist.md`, and the target roadmap detail before implementation.
- This version does not perform broad UI refactoring, DB/R2/Seed/Reset/Cleanup, package changes, or policy changes.
- Next implementation sprint should use the PB backlog and target roadmap detail instead of relying on chat memory.

## 0.24.17 Productization Sprint #1

- 0.24.17 starts the safe implementation pass for WAFL component/source quality cleanup.
- `AdminSettingsHub` keeps its UI behavior but moves payload types, status tone maps, and formatting helpers into `lib/admin/settings/adminSettingsHubPresentation.ts`.
- `WaflUiCatalogPage` keeps its rendered catalog but moves static type definitions into `app/ui/waflUiCatalogTypes.ts` as the first boundary for later data splitting.
- `MaterialsWorkspacePage` replaces a screen-local empty list message with `AdminEmptyState`, keeping the same materials API and permission behavior.
- `APP_VERSION`, roadmap/current-state docs, pending tests, and Sprint prompt template are aligned to 0.24.17.
- DB/R2/Seed/Reset/Cleanup/Migration, runtime policy, permission policy, package metadata, and lockfiles are unchanged.
- Manual confirmation remains needed only for the small `/workspace/materials` empty-state visual change.

## 0.24.15 Productization Audit Policy

- 0.24.15 expands the previous screen/source refactoring audit into WAFL Productization Audit.
- The audit areas are WAFL Component, UI Consistency, Source Quality, Common Module, i18n, Runtime/Permission, Functions, Product Cleanup, Performance, and Release Readiness.
- Canonical outputs are `docs/audits/productization-audit-report-0.24.15.md` and `docs/productization-backlog.md`.
- PB items are tracked as productization backlog entries and should be resolved by priority, not by ad hoc screen edits.
- DB/R2/Seed/Reset/Cleanup/Migration execution is not part of 0.24.15.
- After 0.24.16, implementation sprints should start from PB Critical/High items that can be handled without policy or data-shape changes.

## 0.24.14 Functions Automation Policy

- `/functions` must show automation profile, command, safety grade, and execution note.
- `functions-automation` is the canonical verify profile for catalog, storage, environment, PDF, and automation coverage contracts.
- Seed, Reset, Cleanup, R2 mutation, and DB mutation stay guarded by dry-run/confirmation/fingerprint/prefix/service-code rules.
- The catalog may describe executable commands, but it must not execute DB/R2/Seed/Reset/Cleanup during documentation or catalog verification.

## 0.24.18 Productization Canonical Standards

- `docs/project/05-productization-bible.md` defines the canonical productization principles, PB lifecycle, release gates, and ownership.
- `docs/project/06-architecture-guide.md` defines layer boundaries, dependency direction, mutation rules, runtime/permission separation, and PDF/R2 architecture boundaries.
- `docs/project/07-wafl-component-standard.md` defines WAFL component families, interaction, accessibility, responsive, and adoption rules.
- `docs/project/08-release-readiness-matrix.md` records release conditions, current status, evidence, ownership, and blocking rules.
- This version changes documents and roadmap/version metadata only. Runtime behavior, permissions, DB, R2, package metadata, and lockfiles remain unchanged.


## 0.24.19 PDF, R2, and Administrator Operations Policy

- `docs/project/09-pdf-specification.md` defines workorder/supplier PDF families, versioned document models, draft/final behavior, permissions, idempotency, metadata, and QA evidence.
- `docs/project/10-r2-storage-policy.md` defines tenant-safe object keys, storage classes, logical/physical usage, quota, lifecycle, retention, private download, and dry-run reconciliation.
- `docs/project/11-admin-operations-design.md` separates company administrator and system administrator responsibilities and defines action classes, approval, audit, support access, incident, storage, and release operations.
- This version is policy/documentation only. It does not activate PDF generation, production R2 mutation, DB/schema changes, support content access, or destructive administration.
- Remaining user decisions include plan capacity/overage, retention/grace/purge periods, support content-access policy, and four-eyes operation scope.


## 0.24.21.1 System Default Catalog and Seed Contract

- `docs/project/19-system-default-catalog-and-seed-spec.md` is the canonical input for product taxonomy, garment measurement catalog, company provisioning, seed, and backfill work.
- The current canonical seed has only three product paths: top/t-shirt/short-sleeve, bottom/pants/slacks, and outer/jacket/tailored. This is recorded as a productization gap, not fixed by this documentation patch.
- Codex must investigate existing schema and repository support before creating SQL or migration.
- Stable codes, idempotent seed, preservation of company-disabled settings, existing document references, dry-run evidence, and company-scoped retry are mandatory.
- No DB/R2/Seed/Reset/Cleanup/Migration execution is included in 0.24.21.1.
- Next GPT documentation target is 0.24.21.2 customer signup, policy consent, approval, Trial, and initial company provisioning flow.

## Repository Cleanup Foundation

- 기준 문서: `docs/project/24-repository-cleanup-foundation.md`
- handoff ZIP은 generated outputs를 제외한다.
- GitHub에서 정상인 한글 경로를 rename하지 않는다.
- 대량 삭제·이동·소스 분해는 Codex Cleanup Sprint로 분리한다.


## 한글 / Unicode 인코딩 기준

- canonical 문서: `docs/project/25-korean-unicode-encoding-standard.md`
- 일반 소스·문서는 UTF-8, Windows PowerShell 스크립트는 UTF-8 BOM을 사용한다.
- GitHub에서 정상인 한글 경로는 ZIP 분석 도구의 깨진 표시만 보고 rename하지 않는다.
- `node tests/unicode-encoding-contract.mjs`로 decode, U+FFFD, 경로 round-trip과 PowerShell BOM을 검증한다.
