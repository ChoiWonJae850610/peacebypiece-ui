# WAFL v2 Start Here - 0.30.0-alpha.10

## Purpose

This document starts the WAFL v2 redesign line.

WAFL v2 is not a continuation of the 0.24.x workorder-form productization line. It is a product-direction reset that keeps the existing operational safeguards while redesigning the product model, screen model, permission model, status model, and design system around a clothing-production workspace.

## One-line definition

WAFL v2 is a card-based clothing-production workspace where a product/style, its WAFL Sheet, images, fabric, accessories, factory/process work, PDF/share flow, reorder history, and events live in one connected workspace.

Short product phrase:

```text
WAFL v2 = 옷 하나를 만들기 위한 카드형 제작 워크스페이스
```

## Why v2 starts now

The current 0.24.x line has accumulated meaningful foundations:

- Next.js App Router, TypeScript, Tailwind CSS.
- Vercel deployment workflow.
- GitHub `master` based work.
- Build/test/QA pipeline.
- Dev/test environment and reset/seed automation.
- Production guardrails.
- Signup, company, member, permission, R2, PDF, and system-admin foundations.

However, the product direction has become too close to a workorder-management program with many attached functions. WAFL v2 changes the core mental model before real customer data exists and before an external launch date is fixed.

## v1 / 0.24.x framing

```text
Workorder-centered app
→ workorder list
→ workorder detail form
→ fabric/accessory/factory/attachment/PDF features attached around it
```

Problems with this framing:

- The product can feel like a form-heavy ERP/backoffice tool.
- Image/sketch data is not naturally treated as a first-class production object.
- Material/accessory order workflows can feel like separate modules.
- The user does not immediately feel that they are working on one garment/style as a living production workspace.

## v2 framing

```text
Product / Style
└─ WAFL Sheet
   └─ Sheet Cards
      ├─ image/sketch
      ├─ base info
      ├─ fabric
      ├─ accessory
      ├─ factory/process
      ├─ PDF/share
      └─ history/events
```

Core shift:

- From `작업지시서 프로그램` to `옷 제작 카드 워크스페이스`.
- From form completion to card-by-card production progress.
- From separate order screens as the main flow to Sheet card actions.
- From right-side management panel to Assistant.
- From attachment as a secondary file concept to product image/sketch as core data.

## Confirmed first decisions

The owner confirmed the first WAFL v2 design decisions for this baseline:

1. Top-level business object: `Product / Style`.
2. Main screen/document object: `WAFL Sheet`.
3. `작업지시서` can remain in PDF/field-facing wording, but the app framing should use `WAFL Sheet`.
4. Fabric/accessory/factory/order actions should live primarily inside Sheet cards.
5. Independent fabric/accessory order screens may remain as secondary inquiry/management screens.
6. New Sheet creation should be lightweight.
7. Product name and quantity are the minimum creation baseline.
8. Product image/sketch is strongly recommended, but not always mandatory at creation.
9. Assistant should use risk-based warning/confirmation/blocking rather than blocking all incomplete states.
10. Mobile should be card-flow-first, not a compressed PC layout.

## Canonical v2 document set

The target v2 document structure is:

```text
docs/project/v2/
  00-start-here.md
  01-product-definition.md
  02-ui-philosophy.md
  03-data-model.md
  04-permission-action-codes.md
  05-status-workflow.md
  06-screen-spec.md
  07-design-system.md
  08-feature-spec.md
  09-test-plan.md
  10-roadmap-0.30.md
  11-pdf-share-spec.md
  12-codex-working-rules.md
```

The baseline documents are now expanded with product definition, UI philosophy, role/workflow scenarios, data model, permission action codes, status workflow, design-system standard, PDF/share baseline, Worker-controlled storage lifecycle, and the first mobile-web test-plan baseline. Later patches should still complete seed data scenarios, detailed v1 keep/rewrite/archive planning, 0.30 roadmap, and Codex working rules before major implementation.

## v2 read order

For WAFL v2 work, read:

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
13. `docs/project/v2/11-pdf-share-spec.md`
14. Later v2 canonical documents as they are created.
12. Operational guardrail documents such as encoding, production guard, evidence standard, patch packaging, R2 policy, and test automation documents.
13. v1 documents only when explicitly needed for historical or operational reference.

## Keep from v1

WAFL v2 keeps these non-negotiable operational rules:

- Production guardrails.
- Secrets exclusion.
- Korean Unicode/encoding safeguards.
- Patch ZIP flat structure.
- `commit-meta.md` required token contract.
- Build/test/QA evidence rules.
- Dev/test reset and seed restrictions.
- Vercel deployment and real-device QA workflow.
- R2 tenant isolation and storage safety.
- System-admin access protection.

## Rewrite for v2

The following areas should be rewritten around the v2 model:

- Product definition.
- Information architecture.
- Screen structure.
- Data model.
- Permission action codes.
- Status workflow.
- Design system.
- PDF/share model.
- Test seed scenarios.
- 0.30 roadmap.

## Archive/reference principle

Do not delete old 0.24.x documents during early v2 design work. Classify them first:

- `Keep`: operational guardrails that still apply.
- `Rewrite`: product/screen/DB documents that conflict with v2.
- `Archive`: v1 implementation history or old workorder-centered specs.
- `Defer`: low-priority details that should not block the v2 core.

A future patch may move v1 documents to `docs/archive/v1-0.24/`, but this must be explicit and should not be combined with large implementation changes.

## Current checkpoint boundary

`0.30.0-alpha.6` adds the WAFL v2 PDF/share baseline. `0.30.0-alpha.5` adds the WAFL v2 design-system baseline and clarifies that `/ui` is the later Figma-style showroom. `0.30.0-alpha.4` clarifies and corrects the 0.30.0-alpha.3 data/permission/status baseline. `0.30.0-alpha.3` extended the design baseline with data model, permission action codes, and status workflow principles after the 0.30.0-alpha.2 role/workflow baseline.

It must not include:

- DB migration.
- API implementation.
- Route rewrites.
- Production behavior changes.
- R2 mutation.
- Large file movement or deletion.
- UI implementation beyond later planned `/ui` showroom work.

## 0.30.0-alpha.5 design-system baseline

`0.30.0-alpha.5` adds `docs/project/v2/07-design-system.md` as the first design-system standard.

Confirmed design-system principles:

- The concept image is a moodboard, not an exact implementation target.
- `docs/project/v2/07-design-system.md` is the design source of truth.
- `/ui` is the future live showroom for WAFL v2 components.
- User-facing UI must use Korean labels first.
- Internal code values may remain English for TypeScript/DB/test stability.
- WAFL v2 UI must be image-first, card-based, Sheet-centered, and Assistant-guided.

The next UI-related implementation step should be restricted to `/ui` showroom samples, not a full workspace rewrite.

## Codex handoff rule

Codex should not receive a broad instruction like "improve everything".

Codex work must be split by scope:

1. Documentation creation/synchronization.
2. `/ui` v2 showroom prototype.
3. Data model/type draft.
4. Permission/action code catalog.
5. Status workflow catalog.
6. Seed/test plan.
7. Workspace prototype.

Each Codex prompt must include:

- Canonical read order.
- Allowed files.
- Forbidden files.
- DB migration status.
- Test command.
- Version and `commit-meta.md` rules.
- Production guard.
- Completion criteria.


## 0.30.0-alpha.2 role/workflow baseline

`0.30.0-alpha.2` adds the second GPT-side design baseline:

- User and role model for v2 planning.
- Workspace role behavior for owner/admin, designer, production manager, inspection manager, and system admin.
- External partner handling as PDF/share-link first, account/portal later.
- Core workflow scenarios for new Sheet creation, fabric order, accessory order, factory instruction, inspection/inbound, reorder, and PDF/share.
- UI philosophy that keeps WAFL Sheet as the central workspace and Assistant as the next-action guide.

These are still design documents, not implementation changes. They do not authorize DB migration, API implementation, production data mutation, route rewrites, or large source refactoring.

## 0.30.0-alpha.3 data/permission/status baseline

`0.30.0-alpha.3` adds the third GPT-side design baseline:

- `docs/project/v2/03-data-model.md`
- `docs/project/v2/04-permission-action-codes.md`
- `docs/project/v2/05-status-workflow.md`

Confirmed working defaults:

1. Use a hybrid data model:
   - normalized core entities,
   - typed card detail tables,
   - limited JSON metadata only where appropriate.
2. Keep Product/Style as the top-level business object.
3. Keep WAFL Sheet as the central production document.
4. Keep Sheet Card as the card/workflow unit.
5. Use action-code based permission checks.
6. Treat human-readable roles as permission presets, not implementation branches.
7. Separate Sheet status from card status.
8. Use Assistant warning/confirmation/blocking by risk.
9. Treat reorder as new Sheet/version creation.
10. Treat PDF/share as Sheet snapshot/share-link workflow.

These are still design documents, not implementation changes. They do not authorize DB migration, API implementation, seed mutation, production data changes, route rewrites, R2 mutation, or package dependency changes.

## 12-point Codex handoff progress

Current GPT-side progress against the owner-approved Codex handoff checklist:

```text
1. WAFL v2 product definition fixed: done
2. Center objects Product / Sheet / SheetCard fixed: done
3. Main IA and screen model drafted: done
4. DB table baseline drafted: done in 0.30.0-alpha.3
5. Permission action code catalog drafted: done in 0.30.0-alpha.3
6. Status model drafted: done in 0.30.0-alpha.3
7. PDF/share method: pending
8. /ui design-system component set: pending
9. Seed/test scenarios: pending
10. v1 keep/rewrite/archive rules: first baseline done, detailed archive plan pending
11. Codex read order: updated, final sync pending
12. 0.30 roadmap: pending
```

Next GPT-side checkpoint should be `0.30.0-alpha.4` for design system and `/ui` showroom contract.



## 0.30.0-alpha.4 owner clarification baseline

The owner clarified the following after `0.30.0-alpha.3` had already been applied and pushed:

```text
Database:
- Neon DB is already in use.
- v2 data-model redesign means schema/migration planning on top of Neon unless explicitly changed.

Storage:
- Cloudflare R2 is already in use.
- PDF, PDF snapshots, representative images, sketches, and uploaded attachments use R2.
- Representative images and sketches are core WAFL data, not merely secondary attachments.

Roles:
- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

Language:
- User-facing docs/screens use Korean labels first.
- Internal DB/API/TypeScript/test values may use English codes.
```

This correction is recorded as `0.30.0-alpha.4` instead of reusing `0.30.0-alpha.3`, because the patch workflow may already commit and push immediately after the owner downloads a patch.

## Updated 12-point Codex handoff progress after 0.30.0-alpha.4

```text
1. WAFL v2 product definition fixed: done
2. Center objects Product / Sheet / SheetCard fixed: done
3. Main IA and screen model drafted: done
4. DB table baseline drafted: done, Neon/R2 baseline clarified in 0.30.0-alpha.4
5. Permission action code catalog drafted: done, Korean role set clarified in 0.30.0-alpha.4
6. Status model drafted: done, Korean labels clarified in 0.30.0-alpha.4
7. PDF/share method: pending
8. /ui design-system component set: pending
9. Seed/test scenarios: pending
10. v1 keep/rewrite/archive rules: first baseline done, detailed archive plan pending
11. Codex read order: updated, final sync pending
12. 0.30 roadmap: pending
```

Next GPT-side checkpoint should be `0.30.0-alpha.5` for design system and `/ui` showroom contract, unless another owner clarification is needed first.


## 0.30.0-alpha.6 PDF/share baseline

`0.30.0-alpha.6` adds `docs/project/v2/11-pdf-share-spec.md` as the first PDF/share planning contract.

Confirmed PDF/share principles:

- PDF/share is part of the WAFL Sheet workflow, not a secondary export feature.
- Generated PDFs are snapshots of Sheet data at a specific time.
- Shared PDFs must use WAFL controlled links, not raw R2 URLs.
- Neon remains the metadata DB baseline and Cloudflare R2 remains the object-storage baseline.
- KakaoTalk support starts with controlled share links and copy/share-sheet flow; direct Kakao API integration is later.
- External recipients are controlled-link viewers in alpha, not login roles.
- Cost visibility must follow `cost.view` and must not leak into external PDFs by default.
- PDF/share implementation must create generation/share/view/revoke events when later built.

## Updated 12-point Codex handoff progress after 0.30.0-alpha.6

```text
1. WAFL v2 product definition fixed: done
2. Center objects Product / Sheet / SheetCard fixed: done
3. Main IA and screen model drafted: done
4. DB table baseline drafted: done, Neon/R2 baseline clarified in 0.30.0-alpha.4
5. Permission action code catalog drafted: done, Korean role set clarified in 0.30.0-alpha.4
6. Status model drafted: done, Korean labels clarified in 0.30.0-alpha.4
7. PDF/share method: done in 0.30.0-alpha.6, Worker-controlled storage and temporary/final PDF lifecycle clarified in 0.30.0-alpha.7
8. /ui design-system component set: done in 0.30.0-alpha.5
9. Seed/test scenarios: pending
10. v1 keep/rewrite/archive rules: first baseline done, detailed archive plan pending
11. Codex read order: updated, final sync pending
12. 0.30 roadmap: pending
```

Next GPT-side checkpoint should be `0.30.0-alpha.7` for seed/test scenarios or v1 keep/rewrite/archive detail, unless another owner clarification is needed first.

## 0.30.0-alpha.7 PDF/Worker/lifecycle clarification

`0.30.0-alpha.7` clarifies the PDF/share baseline after owner feedback.

Confirmed additions:

- R2 is the object storage backend, but users and browser UI must not manage raw R2 access.
- Upload, download/view, delete, restore, purge, and generated-PDF storage flows must use WAFL-controlled API/Worker gateways.
- The current repository includes `cloudflare/r2-upload-worker.js` as the R2 upload/download/delete Worker baseline.
- The current repository includes `cloudflare/pdf-generator-worker/` as the PDF Generator Worker deployment baseline.
- `cloudflare/pdf-generator-worker.js` is deprecated/reference unless a later Worker audit explicitly changes that status.
- PDF planning must distinguish 임시 PDF from 최종/공유 PDF snapshot.
- 임시 PDF is a preview/review artifact and can be cleanup-controlled.
- 최종/공유 PDF is an audit/history artifact and must not be silently overwritten.

Updated implementation stance:

```text
Sheet data in Neon
-> PDF render request through WAFL app/API
-> PDF Generator Worker when implementation needs generated bytes
-> generated bytes stored through the controlled R2 upload flow
-> R2 object stored as backend object
-> Neon metadata records file/pdf/share/event state
-> external user receives WAFL controlled share route, not raw R2 URL
```

This clarification does not authorize Worker code changes, DB migration, R2 mutation, production storage changes, or PDF generator behavior changes.



## Mobile-web quality baseline

WAFL v2 must be treated as a web app that is used on real devices, not as a desktop-only design exercise.

The design and implementation baseline must account for:

```text
- iPhone Safari and Chrome input focus behavior
- Android Chrome input and keyboard behavior
- Korean IME composition stability
- mobile keyboard viewport changes
- modal/drawer backdrop and scroll lock
- focus trap and focus restoration
- safe-area inset handling
- portrait/landscape orientation changes
- tablet portrait/landscape layout changes
```

Known prior WAFL risk areas:

```text
- iPhone input focus can zoom the page when actual input font size is too small.
- Korean typing can lose focus if fields remount on every character.
- Autosave, validation, list reordering, or unstable React keys can break input focus.
- Modal/backdrop/scroll-lock behavior can become inconsistent across screens.
- Rotating a device can break open drawers, modals, bottom sheets, and PDF previews.
```

Design-system and component work must therefore include mobile-web interaction acceptance criteria before workspace implementation.

See:

```text
docs/project/v2/07-design-system.md
docs/project/v2/09-test-plan.md
```

## 0.30.0-alpha.9 seed/test scenario baseline

This checkpoint defines dev/test seed and QA scenario planning for WAFL v2.

Seed design is part of the product specification, not an implementation permission. It must be treated as a controlled dev/test-only plan that prepares future Codex implementation work.

### Seed baseline principles

```text
- Seed data is allowed only in dev/test environments.
- Production data must never be created, reset, overwritten, or deleted by v2 seed work.
- Seed commands must be explicit, labeled, and environment-guarded.
- Destructive reset/seed actions require visible confirmation.
- Neon is the metadata/database baseline.
- Cloudflare R2 is the object storage baseline.
- Upload/delete/PDF file flows must use WAFL-controlled API or Worker gateways, not raw browser-managed R2 access.
- System-admin test switching must remain dev/test-only and audit-logged.
```

### Required v2 seed coverage

The future v2 seed implementation must cover:

```text
고객사:
- normal active company
- low-data trial company
- high R2 usage company
- paused/service-limited company
- company with incomplete onboarding or policy state when needed for system-admin QA

사용자:
- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

Sheet/Product scenarios:
- minimal draft Sheet
- ready Sheet with image/sketch
- fabric missing price warning
- accessory skipped scenario
- factory/process assigned scenario
- ordered/shared PDF scenario
- making scenario
- inspection with defect quantity
- completed scenario
- reorder scenario
- hold/issue scenario

PDF/R2 scenarios:
- 임시 PDF(temporary_preview)
- 검토용 PDF(review)
- 공유용 PDF(shared_snapshot)
- 최종 PDF(final_snapshot)
- 만료/폐기 share link
- representative image and sketch files
- R2 usage levels by company/plan
```

### Future PowerShell / dev console follow-up

This checkpoint does not change the PowerShell automation script. It records required follow-up menu concepts for later Codex work:

```text
- V2 Seed Plan Validate: safe, dry-run, dev/test-only
- V2 Seed Apply: data-creating, dev/test-only, confirmation required
- V2 Seed Reset: destructive, dev/test-only, explicit confirmation required
- V2 Mobile QA Checklist: safe, report/export only
- V2 R2 Usage Scenario Seed: dev/test-only, must not touch production R2
```

See `docs/project/v2/09-test-plan.md` for the detailed seed/test scenario matrix.


## 0.30.0-alpha.10 document governance checkpoint

`0.30.0-alpha.10` closes the first-pass GPT design baseline for Codex entry.

The v2 canonical set is now:

```text
docs/project/v2/00-start-here.md
docs/project/v2/01-product-definition.md
docs/project/v2/02-ui-philosophy.md
docs/project/v2/03-data-model.md
docs/project/v2/04-permission-action-codes.md
docs/project/v2/05-status-workflow.md
docs/project/v2/06-screen-spec.md
docs/project/v2/07-design-system.md
docs/project/v2/08-feature-spec.md
docs/project/v2/09-test-plan.md
docs/project/v2/10-roadmap-0.30.md
docs/project/v2/11-pdf-share-spec.md
docs/project/v2/12-codex-working-rules.md
```

### Document precedence

For v2 product, UI, DB, permission, status, PDF/share, test, and roadmap decisions:

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/v2/*`
4. durable operational rules from existing v1 documents
5. old `0.24.x` implementation documents only as reference

If a v1 workorder-centric document conflicts with v2, v2 wins unless the conflict is about production guard, Korean encoding, build/test safety, secrets, R2/Worker security, or deployment safety.

### First-pass completion state

The initial 12 Codex-entry criteria are documented, but implementation is still gated. The next step is not broad implementation. The next step is a consolidated GPT review and then a narrow Codex work order.
