# WAFL v2 Codex Working Rules - 0.30.0-alpha.10

## Purpose

This document defines how Codex must work on WAFL v2.

Codex is the implementer, not the product owner. For v2, GPT defines the design baseline and Codex executes narrow, explicit work orders.

## Required read order

Before any v2 file modification, read:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/00-start-here.md`
4. `docs/project/v2/01-product-definition.md`
5. `docs/project/v2/02-ui-philosophy.md`
6. `docs/project/v2/03-data-model.md`
7. `docs/project/v2/04-permission-action-codes.md`
8. `docs/project/v2/05-status-workflow.md`
9. `docs/project/v2/06-screen-spec.md`
10. `docs/project/v2/07-design-system.md`
11. `docs/project/v2/08-feature-spec.md`
12. `docs/project/v2/09-test-plan.md`
13. `docs/project/v2/10-roadmap-0.30.md`
14. `docs/project/v2/11-pdf-share-spec.md`
15. `docs/project/v2/12-codex-working-rules.md`
16. `docs/project/25-korean-unicode-encoding-standard.md`
17. `docs/project/32-product-completion-and-ui-evidence-standard.md`

Read v1 documents only when the work order asks for them or when operational safety requires them.

## v1 document classification

### Keep as active operational rules

These remain active for v2 unless directly replaced by a v2 document.

```text
AGENTS.md
docs/codex-current-state.md
docs/project/25-korean-unicode-encoding-standard.md
docs/project/32-product-completion-and-ui-evidence-standard.md
docs/project/10-r2-storage-policy.md
docs/project/12-release-engineering.md
docs/project/13-qa-matrix.md
docs/project/14-playwright-plan.md
docs/project/15-browser-device-matrix.md
tools/pipeline/peacebypiece-auto-pipeline.ps1
tools/pipeline/download-watcher.ps1
tools/pipeline/pipeline-patch-processing.ps1
```

Keep 이유:

```text
- Korean Unicode/encoding safety.
- production guard.
- patch ZIP and commit-meta safety.
- build/test/QA evidence.
- Vercel real-device QA flow.
- R2/Worker operational safety.
- dev/test reset/seed safety.
```

### Rewrite for v2

These are not deleted, but their v1 product assumptions must not drive v2 implementation.

```text
docs/project/26-final-policy-decisions-and-master-todo.md
docs/project/31-pre-codex-integrated-master-plan.md
docs/productization-roadmap.md
docs/productization-backlog.md
docs/project/17-codex-ready-queue.md
docs/project/18-sprint-queue.md
docs/project/23-codex-productization-sprint-master-pack.md
docs/project/codex-sprint-prompt.md
```

Rewrite 이유:

```text
- They are workorder-centric or 0.24.x productization-centric.
- v2 changes the center object to Product/Style + WAFL Sheet + Sheet Card.
- v2 changes /ui, /functions, and /roadmap roles.
- v2 changes implementation sequencing.
```

### Reference only

Use these as implementation references only after v2 intent is clear.

```text
docs/project/09-pdf-specification.md
docs/project/11-admin-operations-design.md
docs/project/19-system-default-catalog-and-seed-spec.md
docs/project/20-customer-signup-consent-approval-trial-spec.md
docs/project/27-database-schema-query-permission-audit.md
docs/project/28-database-source-of-truth-safe-migration-design.md
docs/project/29-db-readonly-audit-menu-standard.md
docs/project/33-public-signup-schema-repository-prep-0.24.26.md
docs/project/33-workorder-pdf-size-dashboard-finalization.md
```

Reference 이유:

```text
- They contain useful DB, PDF, system-admin, signup, storage, and audit details.
- But their screen and product assumptions may be v1-specific.
```

### Archive candidates

Do not delete yet. Move only when a separate archive patch is explicitly requested.

```text
old sprint notes
old one-off audit notes
old UI cleanup notes
old workorder-specific remediation notes
duplicate 0.24.x planning files
```

Archive target:

```text
docs/archive/v1-0.24/
```

## Work order requirements

Every Codex v2 work order must include:

```text
1. canonical read order
2. current source version
3. result version
4. exact goal
5. allowed files
6. forbidden files
7. DB migration 여부
8. R2/Worker mutation 여부
9. production behavior change 여부
10. package dependency change 여부
11. tests/build commands
12. commit-meta and patch ZIP rules
13. completion criteria
```

## Default forbidden work

Unless explicitly allowed, Codex must not:

```text
- run or create production mutations
- change production guards
- change secrets or .env files
- expose raw R2 URLs
- bypass Worker/API file controls
- perform DB migration
- implement broad workspace rewrite
- delete v1 documents
- change package.json/package-lock.json
- remove existing routes
- change external billing/signup/legal behavior
```

## Version and patch rules

For patch delivery:

```text
- patch ZIP: peacebypiece-patch-<version>-files.zip
- flat ZIP structure only
- include top-level commit-meta.md
- path-encoded filenames use __
- APP_VERSION, commit-meta Version, patch ZIP version, and answer result version must match
```

`commit-meta.md` must include:

```text
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

Do not use the old token:

```text
변경 파일 목록 :
```

## Codex reasoning level guidance

```text
문서 생성/동기화: 중간
/ui showroom prototype: 중간~높음
DB/권한/상태 schema work: 높음
Worker/R2/PDF lifecycle work: 높음
production guard/security work: 높음
오타/버전/문구 수정: 낮음
```

## v2 implementation principle

Do not rebuild everything at once.

Recommended order:

```text
1. v2 docs conflict review
2. /ui design showroom
3. action code catalog/type definitions
4. mock WAFL Sheet prototype
5. dev/test seed scenarios
6. Neon migration plan
7. API/Worker integration plan
8. workspace migration
```

Codex must always preserve the v2 principle:

```text
WAFL v2 = 옷 하나를 만들기 위한 카드형 제작 워크스페이스
```
