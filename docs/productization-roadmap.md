# PeaceByPiece / WAFL Productization Roadmap

## Status

- Roadmap checkpoint version: `0.24.12`
- APP_VERSION: `0.24.12`
- Feature implementation progress: about `93%`
- Productization readiness: `77%`
- Canonical structured source: `lib/internal/roadmap/index.ts`
- Compatibility facade: `lib/internal/productizationRoadmap.ts`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`

`/roadmap` is now the shared development board for the user, ChatGPT, and Codex. It shows two levels of information in one read-only system-admin screen:

- user-facing version summaries
- detailed development contracts used before starting a version

The screen must stay read-only. Do not add edit, add, delete, save, drag-and-drop, localStorage canonical source, query mutation, DB write, or R2 write paths without a separate explicit policy decision.

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
- PDF/R2 정책과 supplier/material-order PDF는 0.24.13으로 이월

0.24.12 적용 내용:

- `/worker`를 fixed workspace shell 경계에 맞춰 `/workspace/workorders`와 같은 density/스크롤 기준으로 정렬했다.
- 작업지시서와 발주서가 공유하는 responsive frame, layout mode, 저장 lock/toast 기준을 `workspace-commonization` 계약으로 고정했다.
- Codex Optimization Phase 1로 `docs/codex-current-state.md`를 짧은 작업 시작 매니페스트로 정리했다.
- UI/반응형 수동 확인 전에는 완료로 전환하지 않는다.

## Version Roadmap

| Version | Title | Status | Boundary |
|---|---|---|---|
| `0.24.10` | 시스템 관리자 저장공간과 자동화 기반 | 완료 | DB-backed storage usage and initial verification/finish wrappers |
| `0.24.11` | 시스템 관리자 ID 제어와 roadmap 기준판 | 진행 중 | `/id-control`, `/roadmap`, canonical roadmap, post-finish handoff |
| `0.24.12` | 일반 사용자 workspace 및 worker 공통화 | 사용자 확인 필요 | General user workspace/worker UI density, responsive shell, save flow |
| `0.24.13` | 작업지시서와 발주서 PDF | 예정 | PDF, Worker/R2, temporary/final file policy |
| `0.24.14` | Functions, Simulator, PowerShell 자동화 정리 | 예정 | Dev/test tooling and execute/dry-run safety |
| `0.24.15` | 통합 검증 체크포인트 | 검증 대기 | Full validation and productization readiness recalculation |

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

The normal wrapper commands for this workspace commonization work are:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\pipeline\approved-workflow.ps1 -Action Verify -Profile workspace-commonization
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
- PDF/R2 policy and supplier/material-order PDF remain 0.24.13 work.
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
