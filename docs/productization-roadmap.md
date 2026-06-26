# Productization Roadmap Authority

> Active baseline: `0.24.23`. Next implementation candidate: `0.24.24` WAFL UI Foundation after 0.24.23 confirmation.
> The only active Sprint sequence is `docs/project/31-pre-codex-integrated-master-plan.md`.
> Sections below that describe 0.24.22 as UI-first, Productization Sprint #2, or PB-005/006/010 are historical records and must not drive implementation.


## 0.24.22 — DB Foundation and Authority Alignment

- 승인된 dev/test DB fingerprint에서 read-only 메뉴 30~32를 실행했다.
- Menu 30 reconciliation: PASS, total result rows 0.
- Menu 31 constraint readiness: PASS, total reported issues 0.
- Menu 32 index readiness: PASS, total result rows 430 reporting-only.
- 문서 27/28/31/32 기준 source-of-truth, migration/backfill/rollback, RLS/tenant 경계를 확인했다.
- production DB/R2 mutation, destructive migration, schema/package/lockfile 변경은 수행하지 않았다.
- DB authority와 migration 후보는 사용자 확인 필요 상태이며, 확인 전 0.24.23을 시작하지 않는다.


## 0.24.23 — Source Architecture Cleanup

- 실제 대형 파일과 책임 집중 영역을 다시 측정했다.
- `WorkOrderDrawingCanvasEditor`에서 canvas primitive/helper/type/icon 책임을 `workOrderDrawingCanvasPrimitives.tsx`로 분리했다.
- drawing editor는 52,725 bytes에서 40,366 bytes로 내려갔고, 새 primitive 파일은 15,425 bytes다.
- `WaflUiCatalogPage`, `AdminSettingsHub`, `joinRequestRepository`, admin i18n, PDF Worker, logger 경계는 감사 문서에 후속 cleanup 순서로 남겼다.
- 권한, tenant, workflow, DB, R2, PDF 정책, package/lockfile은 변경하지 않았다.
- 0.24.24 WAFL UI Foundation은 사용자 승인 전 시작하지 않는다.


## 0.24.21.19 — Final Pre-Codex Contract Gate

- 오래된 고정 버전 계약을 현재 버전과 무관한 구조 계약으로 보정한다.
- 시스템 관리자 Functions 화면의 read-only 상태를 명확히 표시한다.
- PowerShell 개발/테스트 메뉴 33에서 Codex 시작 전 핵심 계약을 한 번에 실행한다.
- roadmap/docs/version 정합성을 0.24.21.19 기준으로 마감한다.
- 이 버전은 DB/R2/PG mutation, schema migration, package/lockfile 변경을 포함하지 않는다.


## 0.24.21.15 pre-Codex policy gate

- Final policy source: `docs/project/26-final-policy-decisions-and-master-todo.md`.
- Reconciliation audit: `docs/project/30-pre-codex-policy-reconciliation.md`.
- Next implementation version is `0.24.22` Sprint A — Database Foundation and Authority Alignment.
# Productization Roadmap

## 0.24.21.16 — Pre-Codex Integrated Master Plan

- 최종 정책, DB 감사, 소스 감사, 미구현 기능, 운영·보안·QA 작업을 하나의 실행계획으로 통합한다.
- 0.24.22는 DB Foundation, 0.24.23은 Source Architecture Cleanup, 0.24.24는 UI Foundation으로 재배치한다.
- 이후 권한/라우팅, 가입, 분류/사이즈, PDF/R2, Export, 자동삭제, PG, 출시 안정화 순서로 진행한다.
- canonical input: `docs/project/31-pre-codex-integrated-master-plan.md`.
- 이번 버전은 문서/roadmap만 변경하며 DB/R2/PG 실행과 migration 적용은 없다.


## 0.24.21.11 — Database Source-of-Truth and Safe Migration Design

- 0.24.21.10 감사 결과를 canonical source-of-truth matrix로 전환한다.
- read-only reconciliation SQL과 실행 금지 safe DDL draft를 제공한다.
- membership, billing, workorder URL, attachment/PDF lifecycle, deletion, category/size/POM 구조의 staged migration·rollback 기준을 확정한다.
- DB/R2/production 실행과 migration 적용은 하지 않는다.
- [SUPERSEDED HISTORICAL RECORD] 당시 다음 버전은 0.24.22 UI Foundation으로 계획했으나, 현재는 0.24.22 DB Foundation으로 대체됐다.

# PeaceByPiece / WAFL Productization Roadmap

## 0.24.21.10 — Database Schema, Query, and Permission Audit

- 60 tables, 193 explicit indexes, 2 views를 정적 inventory한다.
- membership/permission/billing/workorder/file lifecycle의 중복 source of truth를 감사한다.
- repository RLS evidence, tenant query scope, PK/FK/unique/check/timestamp/ID 정책을 감사한다.
- DB/R2/SQL 실행과 migration은 하지 않는다.
- 다음 0.24.21.11에서 safe constraints/indexes와 migration/dry-run/rollback 설계를 작성한다.


## Status

- Roadmap checkpoint version: `0.24.23`
- APP_VERSION: `0.24.23`
- Feature implementation progress: about `93%`
- Productization readiness: about `80%`
- Canonical structured source: `lib/internal/roadmap/index.ts`
- Compatibility facade: `lib/internal/productizationRoadmap.ts`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Current planning policy: 1.0 전까지 `master` 단일 브랜치를 개발/QA 기준으로 사용하며, Vercel 배포본은 운영이 아니라 실기기 QA 환경으로 본다.

`/roadmap` is now the shared development board for the user, ChatGPT, and Codex. It shows two levels of information in one read-only system-admin screen:

- user-facing version summaries
- detailed development contracts used before starting a version

The screen must stay read-only. Do not add edit, add, delete, save, drag-and-drop, localStorage canonical source, query mutation, DB write, or R2 write paths without a separate explicit policy decision.



## 0.24.21.5 Codex Productization Sprint Master Pack

[SUPERSEDED HISTORICAL RECORD] 0.24.18~0.24.21.4에서 확정한 제품화 기준을 Sprint A~F 실행 순서로 통합한다. 0.24.22는 Sprint A만 구현하며 관리자/worker WAFL 밀도, Functions 안전 UX, 저장소 원통형과 회사 파일 상태를 우선한다. Seed/Simulator, 가입·동의·승인, workorder routing, 공개 홈페이지, PDF/R2는 의존성과 사용자 결정 경계에 따라 후속 Sprint로 분리한다.

- canonical input: `docs/project/23-codex-productization-sprint-master-pack.md`
- 이번 버전은 문서/roadmap만 변경
- DB/R2/Seed/Migration 실행 없음
- 사용자 미결정 정책은 Blocked Decision Queue 유지


## 0.24.21.2 고객사 가입·동의·승인·Trial Provisioning 계약

기존 프로젝트의 고객사 승인, 정책 문서 version, 사용자별 동의 이력, Trial 7일/100MB/3명 정책을 공개 가입 요청 흐름과 연결한다. 가입 요청 상태, 시스템 관리자 Queue, 문서별 동의 evidence, 승인 후 회사·최초 관리자·Trial·quota·기본 catalog를 idempotent하게 생성하는 순서를 Codex 구현 입력으로 확정한다. 실제 공개 홈페이지, DB/API/UI, PG/결제, production mutation은 포함하지 않는다.

다음 GPT 문서 버전은 `0.24.21.3`이며 공개 홈페이지 사이트맵, 요금제·기능·보안 콘텐츠, 도메인 분리, 상업 onboarding과 화면 캡처 요구사항을 정리한다.

## 0.24.21.1 시스템 기본 분류·사이즈 스펙·Seed 계약

현재 system standards seed의 생산품 분류가 3개 경로에 그치는 점을 제품화 gap으로 기록한다. 시스템 기본 분류와 고객사 사용자 정의값을 분리하고, 제품군별 기본 사이즈 스펙, 신규 고객사 provisioning, 기존 고객사 idempotent backfill, simulator fixture, 시스템 관리자 운영 화면의 요구사항을 Codex 구현 입력으로 확정한다. 실제 SQL, migration, seed 실행, production mutation은 포함하지 않는다.

다음 GPT 문서 버전은 `0.24.21.2`이며 고객사 가입 요청, 약관 동의, 시스템 관리자 승인, Trial 시작과 초기 회사 provisioning 흐름을 정리한다. 실제 코드 구현 Sprint는 문서 준비 이후 Codex가 수행한다.

## 0.24.21 PB Breakdown 및 Codex Ready Queue

[SUPERSEDED HISTORICAL RECORD] 0.24.21은 Productization Backlog를 Ready/Conditional/Blocked 구현 단위로 분해하고 Codex Ready Queue와 Sprint Queue를 확정한다. 0.24.22는 PB-005, PB-006, PB-010 중심 Productization Sprint #2로 진행한다. 기존 통합 QA 체크포인트는 삭제하지 않고 0.24.25 후보로 이월한다. 사용자 결정 대기 중인 final PDF 상태, 보존기간, production four-eyes 명령은 구현 queue에서 제외한다.

## 0.24.17 Productization Sprint #1

0.24.17 applies the first small productization implementation pass after the 0.24.15 audit and 0.24.16 operating-context checkpoint. It moves `AdminSettingsHub` payload/presentation helpers into a shared module, extracts `WaflUiCatalogPage` static types into a separate catalog type module, and replaces the materials screen's local empty-list message with the shared `AdminEmptyState`. It also adds the reusable Codex sprint prompt template at `docs/project/codex-sprint-prompt.md`. This version does not change runtime gates, permissions, DB schema, API contracts, R2/PDF policy, package metadata, or lockfiles.

## 0.24.16 Codex/GPT operating context checkpoint

0.24.16 establishes the project-owned operating context for future Codex and ChatGPT productization sprints. It adds `docs/project/01-codex-context.md`, `02-project-decisions.md`, `03-productization.md`, and `04-release-checklist.md`; links them from README/docs; and records that future PB implementation work should start from committed project documents rather than chat memory. This version does not perform broad UI refactoring, package/lockfile changes, DB/R2/Seed/Reset/Cleanup, or policy changes.

## 0.24.15 WAFL Productization Audit checkpoint

0.24.15 expands the previous screen/source refactoring audit into a productization audit. It records WAFL Component, UI Consistency, Source Quality, Common Module, i18n, Runtime/Permission, Functions, Product Cleanup, Performance, and Release Readiness findings in `docs/audits/productization-audit-report-0.24.15.md` and converts them into PB backlog entries in `docs/productization-backlog.md`. This version does not run DB/R2/Seed/Reset/Cleanup, does not change package/lockfiles, and does not perform broad UI refactoring.

## 0.24.14 Functions automation checkpoint

0.24.14 makes `/functions` a more reliable development and verification hub. The catalog records profile, command, safety grade, and execution notes for automation links. The `functions-automation` verify profile groups catalog structure, automation coverage, storage, environment, PDF, and approved workflow contracts. This version did not run DB/R2/Seed/Reset/Cleanup and did not relax destructive guards.

## Canonical Policy

Before starting a new version feature task, read the canonical detail in `lib/internal/roadmap/` and the current state in `docs/codex-current-state.md`.

If user chat, old handoff files, archived docs, and current roadmap/current-state conflict, prefer:

1. local Git state
2. `lib/internal/roadmap/*`
3. `docs/codex-current-state.md`
4. current baseline docs under `docs/현재기준/`
5. archived historical docs

Do not expand a roadmap detail beyond its declared scope. If the success conditions cannot be met, do not mark the item complete.

## Roadmap Data Structure

Each version detail includes:

- version, status, title
- user summary, visible changes, expected UI
- development purpose, development UI structure
- scope, out-of-scope
- implementation principles
- success conditions, failure conditions
- cautions, stop conditions
- permission, DB, R2, and migration impact
- automatic and manual tests
- expected change areas
- recommended commit message
- next-version boundary
- completion conditions
- result summary, commit hash, verification result, remaining issues
- user confirmation requirement and result

Status labels shown on `/roadmap` are Korean:

- 예정
- 진행 중
- 구현 완료
- 검증 대기
- 사용자 확인 필요
- 사용자 결정 필요
- 완료
- 보류
- 취소

Completion must not be set unless implementation is done, actual verify-safe passed, a commit hash exists, push completed, origin/master is synchronized, the working tree is clean, and any required user confirmation is complete.

UI, responsive, and PDF work stays in `사용자 확인 필요` until human review is complete, even if automatic tests pass.

0.24.13 이후 roadmap은 기존 기능 계획을 취소하지 않고 재배치한 것이다. PDF, R2, Functions, Simulator, 고객사 관리자, 실기기 QA 기본 기능은 유지하되, 기능 개발을 계속하기 전에 문서/폴더/정책/소스 리팩터링/자동화 구조를 명확히 편입한다. 각 버전은 하나의 큰 목표만 갖고, 감사 버전과 실제 수정 버전은 분리한다.

## 0.24.12 Current Work

Version: `0.24.12`

Title: 일반 사용자 workspace 및 worker 공통화

Status: 사용자 확인 필요

User summary:

- `/worker` 화면의 크기와 정보 밀도를 줄인다.
- 태블릿 가로에서 workspace 패널 스크롤을 정상화한다.
- 작업지시서와 발주서의 화면 구조와 피드백을 통일한다.
- 저장 중 다른 값이 사라지지 않도록 저장 흐름을 안정화한다.

Required development criteria:

- PC 3패널
- iPad mini 가로 2패널 검토
- 큰 태블릿 가로 3패널
- 모바일 및 태블릿 세로 1패널
- 패널 독립 스크롤
- `/worker` density 축소
- workorder/material-order shell 공통화
- entity별 single save queue
- stale response 방지
- toast 통일
- 저장 후 refresh persistence
- 기존 권한 의미 유지
- DB Migration 없음이 기본 전제
- modal/focus 문제는 저장/반응형 작업에 직접 필요한 범위만 포함
- PDF/R2 정책과 supplier/material-order PDF는 재배치 후 0.24.19로 이월

0.24.12 적용 내용:

- `/worker`를 fixed workspace shell 경계에 맞춰 `/workspace/workorders`와 같은 density/스크롤 기준으로 정렬했다.
- 작업지시서와 발주서가 공유하는 responsive frame, layout mode, 저장 lock/toast 기준을 `workspace-commonization` 계약으로 고정했다.
- Codex Optimization Phase 1로 `docs/codex-current-state.md`를 짧은 작업 시작 매니페스트로 정리했다.
- UI/반응형 수동 확인 전에는 완료로 전환하지 않는다.

## 0.24.13 Current Work

Version: `0.24.13`

Title: 문서/폴더 정리 2차

Status: 검증 대기

User summary:

- 기능 개발을 더 이어가기 전에 Codex가 읽는 문서와 폴더 기준을 다시 정리한다.
- 현재 기준 문서, 보관 문서, 감사 문서, root 진입점의 역할을 구분한다.
- 1.0 전까지 Vercel 배포본을 실기기 QA 환경으로 쓰는 흐름을 문서화한다.

Required development criteria:

- `APP_VERSION`은 `0.24.13`으로 갱신한다.
- `docs/codex-current-state.md`가 첫 작업 시작 매니페스트 역할을 한다.
- `docs/현재기준/document-management.md`가 문서 계층과 검색 제외 기준을 설명한다.
- `docs/audits/document-structure-cleanup-0.24.13.md`가 대량 이동을 보류한 이유와 후속 기준을 기록한다.
- 보관 문서와 legacy/history 문서는 기본 검색 제외 대상으로 문서화한다.
- 1.0 전 `master` 단일 브랜치와 Vercel QA 흐름을 README/docs에 명시한다.
- 기능 코드, DB, R2, Seed, Reset, Cleanup, Migration은 변경하지 않는다.

0.24.13 적용 내용:

- 문서 진입점과 현재 기준 문서의 역할을 정리했다.
- 보관 문서 기본 제외와 root 문서 최소화 기준을 추가했다.
- Vercel 배포본을 1.0 전 실기기 QA 환경으로 쓰는 절차를 문서화했다.
- 다음 0.24.14 Functions 정리 작업의 읽기 경로를 고정했다.

## Version Roadmap

Structured roadmap title tokens kept for contract checks: `문서/폴더 정리 2차`, `Functions 90% 구현/검증 정리`, `전체 화면/소스 리팩터링 감사`, `WAFL 컴포넌트 적용/공통화 1차`, `소스 리팩터링 1차`, `R2/Simulator 테스트 기반`, `PDF/R2 정책 및 PDF 생성 구조`, `Functions/Simulator/PowerShell 자동화 확장`, `통합 검증 체크포인트`.

| Version | Title | Status | Boundary |
|---|---|---|---|
| `0.24.10` | 시스템 관리자 저장공간과 자동화 기반 | 완료 | DB-backed storage usage and initial verification/finish wrappers |
| `0.24.11` | 시스템 관리자 ID 제어와 roadmap 기준판 | 완료 | `/id-control`, `/roadmap`, canonical roadmap, post-finish handoff |
| `0.24.12` | 일반 사용자 workspace 및 worker 공통화 | 사용자 확인 필요 | General user workspace/worker UI density, responsive shell, save flow |
| `0.24.13` | 문서/폴더 정리 2차 | 검증 대기 | Root/docs/current-state/index/archive and Vercel QA handoff documentation |
| `0.24.14` | Functions 90% 구현/검증 정리 | 사용자 확인 필요 | `/functions` catalog, PowerShell profile linkage, guarded command visibility |
| `0.24.15` | WAFL Productization Audit | 검증 대기 | Productization audit report and PB backlog without broad implementation changes |
| `0.24.16` | Codex/GPT 제품화 운영 문맥 구축 | 구현 완료 | Project context, decision log, productization guide, and release checklist |
| `0.24.17` | 소스 리팩터링 1차 | 사용자 확인 필요 | Safe shared presentation/type extraction and materials empty-state commonization |
| `0.24.18` | 제품화 기준 문서 확정 | 완료 | Productization Bible, Architecture Guide, WAFL Component Standard, Release Readiness Matrix |
| `0.24.19` | PDF/R2 정책 및 PDF 생성 구조 | 예정 | Temporary/final PDF policy, generation timing, R2 path/delete policy, PDF comparison |
| `0.24.20` | Release Engineering 및 QA 기준 | 완료 | Release engineering, QA matrix, Playwright and browser/device standards |
| `0.24.21` | PB Breakdown 및 Codex Ready Queue | 완료 | PB breakdown, Codex ready queue and integrated verification preparation |
| `0.24.21.9` | Final Policy Decisions and Master TODO | 검증 대기 | Canonical decisions, full undeveloped feature inventory, and implementation queue |
| `0.24.21.18` | Final Pre-Codex Roadmap Contract Fix | 검증 대기 | Canonical 0.24.22 roadmap, contract repair, authority and version consistency |
| `0.24.21.19` | Final Pre-Codex Contract Gate | 검증 대기 | Version-agnostic contracts, system-admin read-only copy, PowerShell menu 33 |
| `0.24.22` | DB Foundation and Authority Alignment | 사용자 결정 필요 | Evidence-first DB authority, RLS, constraints, indexes, reconciliation and migration boundaries |
| `0.24.23` | Source Architecture Cleanup | 검증 대기 | Oversized source split, duplicate boundary audit, PDF Worker and logger cleanup evidence |


## 0.24.21.9 Final Policy Decisions and Master TODO

- Canonical decision and TODO source: `docs/project/26-final-policy-decisions-and-master-todo.md`.
- Consolidates brand/domain/pricing, system catalog/size model, signup/Trial/payment failure, termination/deletion, logs, opaque URL, PDF lifecycle, deployment, and launch policy.
- Conflicting provisional clauses in project specs 19~23 are superseded by document 26.
- No UI/API/DB/R2/PG implementation is included.
- [SUPERSEDED HISTORICAL RECORD] This former UI-first target is replaced by 0.24.22 DB Foundation.

## Standard Completion Flow

Future version work should follow this flow:

1. Read the roadmap detail for the next planned version.
2. Develop only within the declared scope.
3. Update roadmap result with actual implementation, verification, commit, and remaining issues.
4. Run Verify.
5. Run Plan.
6. Run Finish.
7. Commit.
8. Push.
9. Confirm ahead 0 / behind 0 and clean working tree.
10. Generate the latest ZIP, repo-state, and build-result in `4. Newest`.
11. Report the result.

The normal wrapper commands for this roadmap/document contract work are:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile roadmap-development-contract
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Handoff
```

Because 0.24.12 includes UI/responsive behavior, keep the roadmap item in `사용자 확인 필요` until manual confirmation is complete. Commit/push may be deferred when manual confirmation has not been supplied.

## 4. Newest Handoff

After Verify PASS, Plan PASS, Finish PASS, commit, push, ahead/behind 0/0, and clean working tree, the pipeline generates the latest ChatGPT handoff set in `Paths.NewestResultDir`:

- `peacebypiece-ui-{APP_VERSION}.zip`
- `repo-state-{APP_VERSION}-{yyyyMMdd-HHmmss}.txt`
- `build-result-{APP_VERSION}-{yyyyMMdd-HHmmss}.txt`

The ZIP is a full source ZIP with original directory structure, not a flat patch ZIP. It reuses the existing local repo export policy:

- excludes `.git`, `node_modules`, `.next`, `.wrangler`, `artifacts`, `.tmp`, `test-results`, `playwright-report`
- excludes `.env` and `.env.*`, while keeping `.env.example`
- excludes generated ZIP, repo-state, build-result, backup/temp/copy files
- scans suspicious secret/token filenames and text content before creating the ZIP

If artifact generation fails, do not revert the already completed commit or push. Report the failure and rerun the fixed wrapper command instead of manually rebuilding ZIP/repo-state/build-result with ad hoc commands.

## Productization Notes

- No production DB/R2 access or mutation is allowed during 0.24.12.
- DB Migration is not part of 0.24.12.
- Dependency and lockfile changes are not part of this checkpoint.
- PDF/R2 policy and supplier/material-order PDF remain planned work and are now separated into R2/Simulator foundation at 0.24.18 and PDF/R2 policy at 0.24.19.
- Functions/Simulator/PowerShell work is split into Functions catalog coverage at 0.24.14 and automation expansion at 0.24.20.
- Source cleanup is split into productization audit-only 0.24.15, Codex/GPT operating context 0.24.16, WAFL component application after 0.24.16, and source refactoring 0.24.17+. 0.24.15 output is the Productization Audit Report and PB backlog; 0.24.16 output is the committed project operating context for future implementation sprints.
- Final real-device and pre-customer validation is 0.24.21.
- UI/responsive/PDF completion requires manual confirmation when the roadmap detail says so.

## System-Admin Internal Access Baseline

0.24.12 supplement: Non-destructive internal/test/diagnostic features are permission-gated by active `system_admin`, not by `NODE_ENV`, `VERCEL_ENV`, `NEXT_PUBLIC_APP_RUNTIME_MODE`, or `WAFL_ENABLE_DEV_TEST_CONSOLE`. `/id-control` test account switching is allowed only with active `system_admin`, allowlisted targets, signed cookie, original-user match, and audit logs. Destructive Reset, Seed, Cleanup, R2 mutation, DB migration, and Purge guards remain unchanged.

Before starting 0.24.12 feature implementation, system-admin 내부 조회 화면은 환경과 관계없이 접근 가능하도록 보정한다.
이 항목은 0.24.12 기능 개발 전 기반 보정이며, 일반 사용자 workspace/worker 기능 구현을 시작하지 않는다.

- `/id-control`, `/roadmap`, `/ui`, `/functions`는 authenticated active system-admin이면 Vercel preview/production에서도 조회 가능하다.
- 일반 사용자, 고객사 관리자, 작업자, 미인증 사용자는 직접 URL 접근도 차단한다.
- system-admin navigation card는 개발 제어센터, 제품화 로드맵, WAFL UI 카탈로그, 기능 및 자동화 현황을 항상 보여준다.
- 위험 mutation action은 dev/test 환경 제한 유지가 기준이다. Seed, Reset, Cleanup, DB/R2 변경, destructive simulator action, test fixture 생성/삭제, schema 실행은 운영 환경에서 실행하지 않는다.
- 제한된 실행 버튼은 비활성 상태와 한글 사유를 표시하고, secret/token/raw binding은 표시하지 않는다.
- Recommended profile: `system-admin-internal-access`
- DB Migration 없음. 실제 DB/R2 작업 없음.
- 0.24.12 상세 범위는 유지하되, 이번 적용 후 상태는 사용자 확인 필요다.


## 0.24.21.3 Documentation Preparation

Version: `0.24.21.3`

Title: 공개 홈페이지·도메인·상업 Onboarding 계약

Status: 검증 대기

- public marketing website의 사이트맵과 페이지 역할을 고정한다.
- public website, customer app, system-admin의 도메인·인증·배포 경계를 분리한다.
- 기존 Trial·요금제·저장공간 정책을 가격 페이지 표현 기준과 연결한다.
- 제품 캡처, SEO, 문의, analytics 최소수집과 공개 금지 정보 기준을 정의한다.
- 실제 public UI, 가입 API/UI, PG, DNS, production 배포는 Codex 후속 Sprint로 남긴다.
- 다음 `0.24.21.4`는 저장소 원통형 UI, 설정 파일 중복 표시, workorder URL 식별자 등 UI·routing remediation 계약이다.

## 0.24.21.4 Documentation Preparation

Version: `0.24.21.4`

Title: 저장소 UI·회사 파일 필드·Workorder Routing 계약

Status: 검증 대기

- 저장공간 원통형 usage visualization의 geometry, 상태, 접근성, responsive 기준을 고정한다.
- 80% 경고와 100% 신규 업로드 제한을 기존 quota 정책과 연결한다.
- 대표 이미지·사업자등록증은 항목명을 한 번만 표시하고 badge는 등록·검토 상태만 표현한다.
- 작업지시서 URL은 순차 id나 page/index query 대신 opaque public identifier를 사용하도록 canonical 방향을 정한다.
- refresh, direct link, back navigation, old route compatibility, tenant/permission 재검증 조건을 포함한다.
- 실제 UI/routing/API 구현, DB schema/migration/backfill, R2 변경은 Codex 후속 Sprint로 남긴다.
- 다음 `0.24.21.5`는 0.24.22 Codex Sprint Master Pack 통합과 구현 순서·검증·중단 경계 확정이다.


## 0.24.21.8 — Repository Cleanup Foundation

- handoff ZIP generated-output 제외 계약 보강
- 한글 경로 no-rename 정책
- 빈 폴더·문서·package manager·대형 파일 cleanup 경계
- [SUPERSEDED HISTORICAL RECORD] 당시 0.24.22 UI Sprint 계획. 현재 active target은 DB Foundation.


## 한글 / Unicode 인코딩 기준

- canonical 문서: `docs/project/25-korean-unicode-encoding-standard.md`
- 일반 소스·문서는 UTF-8, Windows PowerShell 스크립트는 UTF-8 BOM을 사용한다.
- GitHub에서 정상인 한글 경로는 ZIP 분석 도구의 깨진 표시만 보고 rename하지 않는다.
- `node tests/unicode-encoding-contract.mjs`로 decode, U+FFFD, 경로 round-trip과 PowerShell BOM을 검증한다.
