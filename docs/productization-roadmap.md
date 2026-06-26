# Productization Roadmap Authority

> Active baseline: `0.24.24`. Next implementation candidate: `0.24.25` Authorization, Runtime Boundary, and Opaque Routing after user confirmation.
> The only active Sprint sequence is `docs/project/31-pre-codex-integrated-master-plan.md`.
> Structured canonical source: `lib/internal/roadmap/`.

## Status

- Roadmap checkpoint version: `0.24.24`
- APP_VERSION: `0.24.24`
- Feature implementation progress: about `93%`
- Productization readiness: about `81%`
- Current-state handoff: `docs/codex-current-state.md`
- System-admin screen: `/roadmap`
- Current planning policy: before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA.

## Active Sprint Sequence

1. `0.24.22` - DB Foundation and Authority Alignment
2. `0.24.23` - Source Architecture Cleanup
3. `0.24.24` - WAFL UI Foundation
4. `0.24.25` - Authorization, Runtime Boundary, and Opaque Routing
5. `0.24.26` - Public Signup, Verification, Approval, and Trial
6. `0.24.27` - System Catalog, Sizes, and POM
7. `0.24.28` - PDF and R2 Lifecycle
8. `0.24.29` - Company-wide Export
9. `0.24.30` - Storage Enforcement, Termination, and Automatic Deletion
10. `0.24.31` - PG Billing and Subscription Operations

## 0.24.24 - WAFL UI Foundation

- Added shared `components/common/ui/WaflStorageUsageMeter.tsx`.
- Applied the shared storage usage meter to the customer administrator main dashboard and file storage plan card.
- Reduced `/workspace` dashboard card height and avoided forced 3-column layout before wide desktop.
- Verified `/worker` remains on the existing `WorkOrderWorkspace` route and keeps WAFL empty/loading state panels.
- Did not change permission, tenant, workflow, API, repository, DB, R2, PDF, package, or lockfile behavior.
- Manual PC/mobile/tablet visual confirmation remains required before 0.24.25 starts.

## 0.24.23 - Source Architecture Cleanup

- Measured oversized source files and responsibility hotspots.
- Split `WorkOrderDrawingCanvasEditor` canvas primitive/helper/type/icon responsibility into `workOrderDrawingCanvasPrimitives.tsx`.
- Recorded duplicate repository/service boundaries, dead/mock/fallback candidates, legacy PDF Worker status, TypeScript/API/DB risks, and logger/redaction baseline in `docs/audits/source-architecture-cleanup-0.24.23.md`.
- Did not change permission, tenant, workflow, DB, R2, PDF policy, package, or lockfile behavior.

## 0.24.22 - DB Foundation and Authority Alignment

- Ran approved dev/test read-only DB audit menus 30, 31, and 32.
- Menu 30 reconciliation: PASS, total result rows 0.
- Menu 31 constraint readiness: PASS, total reported issues 0.
- Menu 32 index readiness: PASS, total result rows 430 reporting-only.
- Confirmed source-of-truth, migration/backfill/rollback, RLS/tenant boundaries.
- Did not run production DB/R2 mutation, destructive migration, schema/package/lockfile change.

## Canonical Policy

Before starting a new version feature task, read the canonical detail in `lib/internal/roadmap/` and the current state in `docs/codex-current-state.md`.

If user chat, old handoff files, archived docs, and current roadmap/current-state conflict, prefer:

1. local Git state
2. `lib/internal/roadmap/*`
3. `docs/codex-current-state.md`
4. `docs/project/*`
5. archived historical documents

Do not expand a roadmap detail beyond its declared scope. If success conditions cannot be met, do not mark the item complete.

UI, responsive, and PDF work stays in user-confirmation-needed status until human review is complete, even if automatic tests pass.

## Historical Roadmap Index Tokens

The following historical tokens are kept for roadmap contract compatibility. They are not the active execution order when they conflict with document 31.

- `0.24.13` - 臾몄꽌/?대뜑 ?뺣━ 2李?
- `0.24.14` - Functions 90% 援ы쁽/寃利??뺣━
- `0.24.15` - WAFL Productization Audit
- `0.24.16` - Codex/GPT ?쒗뭹???댁쁺 臾몃㎘ 援ъ텞
- `0.24.17` - ?뚯뒪 由ы뙥?곕쭅 1李?
- `0.24.18` - ?쒗뭹??湲곗? 臾몄꽌 ?뺤젙
- `0.24.19` - PDF/R2 ?뺤콉 諛?PDF ?앹꽦 援ъ“
- `0.24.20` - Release Engineering 諛?QA 湲곗?
- `0.24.21` - PB Breakdown 諛?Codex Ready Queue

Normal UTF-8 titles:

- `0.24.13` - 문서/폴더 정리 2차
- `0.24.14` - Functions 90% 구현/검증 정리
- `0.24.15` - WAFL Productization Audit
- `0.24.16` - Codex/GPT 제품화 운영 문맥 구축
- `0.24.17` - 소스 리팩터링 1차
- `0.24.18` - 제품화 기준 문서 확정
- `0.24.19` - PDF/R2 정책 및 PDF 생성 구조
- `0.24.20` - Release Engineering 및 QA 기준
- `0.24.21` - PB Breakdown 및 Codex Ready Queue

0.24.13 이후 roadmap은 기존 기능 계획을 취소하지 않고 재배치하는 방식으로 정리되었다. Vercel 배포본은 운영이 아니라 실기기 QA 환경이라는 기준은 1.0 전까지 유지한다.
