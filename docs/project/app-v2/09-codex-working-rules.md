# WAFL v2 App-first Codex Working Rules - 2.0.0-alpha.1

## Purpose

This document defines Codex rules for the App-first `2.0.x` line.

## Prompt header rule

Every future Codex instruction for App-first work should start by stating:

```text
Codex 추론 수준:
Codex 속도:
```

Recommended defaults:

- document/UI repeat correction: `높음 + 고속`
- app structure/environment/build setup: `높음 + 표준`
- DB/API/PDF/R2 real integration: `높음` or `매우 높음 + 표준`

## Required read order

Before any App-first file modification, read:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/app-v2/00-start-here.md`
4. `docs/project/app-v2/01-app-first-product-definition.md`
5. `docs/project/app-v2/02-mobile-tablet-ux-principles.md`
6. `docs/project/app-v2/03-app-architecture.md`
7. `docs/project/app-v2/04-auth-google-apple.md`
8. `docs/project/app-v2/05-device-test-plan.md`
9. `docs/project/app-v2/06-expo-environment-setup.md`
10. `docs/project/app-v2/07-feature-map-from-ui-alpha27.md`
11. `docs/project/app-v2/08-roadmap-2.0.md`
12. `docs/project/app-v2/09-codex-working-rules.md`
13. `docs/project/app-v2/10-public-landing-site.md`
14. `docs/project/app-v2/11-app-design-theme-v1.md`
15. `docs/project/v2/00-start-here.md` through `docs/project/v2/14-operational-policy-absorption.md`
16. `docs/project/25-korean-unicode-encoding-standard.md`
17. `docs/project/32-product-completion-and-ui-evidence-standard.md`
18. `docs/project/26-final-policy-decisions-and-master-todo.md`
19. `docs/project/31-pre-codex-integrated-master-plan.md`

## 4. Newest rule

`4. Newest` should contain final deliverables only.

For `2.0.x` App-first pipeline handoff, keep only:

- source ZIP,
- repo-state.

Build logs and verification logs should be stored under `Logs/Repo_Status` and referenced from repo-state unless a future pipeline contract explicitly changes this.

The source ZIP must exclude:

```text
node_modules
apps/mobile/node_modules
.next
.tmp
artifacts
reports
.env*
test-results
playwright-report
coverage
*.tsbuildinfo
cloudflare/pdf-generator-worker/node_modules
generated zip files
repo-state txt
build logs
verification logs
```

Patch ZIPs, when requested, must use a flat structure and include a top-level `commit-meta.md`.

`commit-meta.md` must include:

```text
Version :
Summary :
Description :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

Do not stage or commit `commit-meta.md`.

## Forbidden by default

Unless a future work order explicitly allows it, do not change:

```text
app/api
db
cloudflare
package.json
package-lock.json
pnpm-lock.yaml
pnpm-workspace.yaml
.env*
```

Do not create `mobile/`, `apps/mobile/`, or an Expo project before the `2.0.0-alpha.2` skeleton work order.

For `2.0.0-alpha.2`, `apps/mobile` is explicitly allowed as a standalone Expo skeleton. Allowed files are limited to:

```text
apps/mobile/package.json
apps/mobile/package-lock.json
apps/mobile/app.json or app.config.*
apps/mobile/tsconfig.json
apps/mobile/expo-env.d.ts
apps/mobile/app/**
apps/mobile/assets/**
apps/mobile/components/**
apps/mobile/constants/**
apps/mobile/README.md
```

Do not create a root workspace, root lockfile change, or root package metadata change for the mobile skeleton.

## Route boundary for App-first

- `www.wafl.co.kr` is the public app landing site.
- `/ui`, `/roadmap`, and `/functions` are localhost-only development check routes.
- These routes must be blocked on production domains, Vercel preview hosts, and `www.wafl.co.kr`.
- `/system` and `/workspace` are long-term removal targets, but must not be deleted without a separate explicit replacement/removal work order.

## Verification baseline

Prefer the project pipeline wrapper when it covers the scope:

```text
tools/pipeline/approved-workflow.ps1 -Action Verify
```

For documentation/version-only patches, safe supporting checks may include:

```text
npm run build
npx tsc --noEmit
git diff --check
git diff --cached --check
node tests/unicode-encoding-contract.mjs
```

Do not run destructive DB/R2/Worker commands for App-first documentation work.

For the mobile skeleton, run mobile checks from `apps/mobile` when dependencies are installed:

```text
npm run typecheck
npm run expo:config
```

## App design theme rule

`docs/project/app-v2/11-app-design-theme-v1.md` is the active visual foundation for `2.0.0-alpha.4` and later until replaced.

Rules:

- The app theme is `동대문 제작 워크룸 / Dongdaemun Atelier Ops`.
- Normal mobile production-card screens are portrait-first.
- Tablet must support portrait and landscape.
- The future sketch/drawing module may allow mobile landscape as an exception.
- Do not add font files, external images, or new dependencies for visual polish unless a work order explicitly approves them.
- Real camera, file upload, share, PDF, API, DB, R2, and Worker behavior must remain disconnected during mock-only visual foundation work.

## 2.0.0-alpha.10 icon/action polish rule

For the alpha.10 mobile mock:

- Compact icon actions may include short Korean captions when symbols alone are ambiguous.
- Image thumbnail detail/view and destructive tile actions must stay as sibling controls, not nested buttons.
- Fabric/accessory rows must keep one current status action at most.
- Delete, lock, view, optional photo, order request, and order complete controls should use a consistent compact row grammar.
- Size/color add controls should be placed near the list/table they affect.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/share/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.11 UX correction rule

For the alpha.11 mobile mock:

- Image/attachment should use a carousel/card when image counts grow; do not fall back to an uneven mobile grid for the main review flow.
- Attachment rows must include upload time in `YYYY.MM.DD HH:mm:ss` mock format.
- Overview labels should be concrete production terms such as participating company, fabric supplier, accessory supplier, sewing factory, or inspection partner.
- Size/color defaults should be gender/category/unit/template based. Avoid product-type chip piles that look like fixed taxonomy policy.
- Fabric/accessory status actions must follow `입력중` -> `발주요청` -> `완료`; request and complete controls must not be visible together.
- Production-flow rail readability is a layout concern only. Do not redefine the process model or add persistence.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.12 alpha.11 UX follow-up rule

For the alpha.12 mobile mock:

- Do not start output/share flow deepening until alpha.11 carousel, selector, material status, and production rail feedback is corrected.
- Image carousel index pills should be centered and stable.
- Image/sketch titles are optional and must have fallback labels.
- Size/color should use current-value selectors rather than one large always-visible option pile.
- Saved template lists should be hidden from the default screen.
- Material/accessory status labels should remain fixed in position across rows.
- Completed material/accessory rows should show no action buttons.
- `발주요청` action should be text-first and must not use send/mail/airplane-like symbols.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.13 alpha.12 UX follow-up rule

For the alpha.13 mobile mock:

- Treat this as another alpha.12 UX correction, not output/share flow deepening.
- Image action icons must be dependency-free visual helper components or existing local primitives, not emoji or new icon dependencies.
- Image memo should stay hidden on the default carousel surface.
- Size/color selectors should show current values only on the default screen.
- Material/accessory row actions should sit on the same visual line as unit, unit price, and amount when possible.
- Completed material/accessory rows should show no action buttons.
- Production rail should use one continuous line with dots on top, not visually separate connector fragments.
- Do not add dependencies, icon libraries, external assets, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, or push notification behavior for this polish pass.

## 2.0.0-alpha.14 UI polish + work-order CTA rule

For the alpha.14 mobile mock:

- Treat this as UI polish plus local `작지 발주` CTA mock only.
- Do not start real output/share, PDF, print, order, delivery, upload, camera, image picker, sketch, API, DB, R2, Worker, schema, migration, or production mutation work.
- Image/attachment icons must remain dependency-free local primitives.
- Size/color selectors must keep stable widths when mock values change.
- Status badges and action buttons must use distinct visual grammar.
- Per-item `발주` and global `작지 발주` must remain verbally and visually distinct.
- The `작지 발주` confirmation panel may change only local screen state.
- After mock completion, the rail may show `발주` complete and `자재` derived from existing fabric/accessory statuses.
- Completed material/accessory rows still show no action buttons.
- Do not add dependencies, icon libraries, external assets, fonts, root package changes, root lockfile changes, or real production integration.

## 2.0.0-alpha.15 icon library rule

For the alpha.15 mobile mock:

- `apps/mobile` may use `lucide-react-native` with `react-native-svg` for the icon system.
- Prefer the WAFL local icon wrapper/mapping over ad hoc inline drawings, emoji, or temporary text symbols.
- Keep icon plus short label where pure icon-only slows production judgment.
- Per-item `발주` and global `작지 발주` must stay distinct.
- Do not introduce another icon library for the same purpose.
- Do not add font files, external image assets, root package changes, root lockfile changes, real camera/file picker/upload/sketch/share/print/PDF/order/delivery behavior, API, DB, R2, Worker, schema, migration, or production mutation.
