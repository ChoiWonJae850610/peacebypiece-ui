# WAFL v2 Start Here - 0.30.0-alpha.4

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

The first baseline documents are now expanded with product definition, UI philosophy, role/workflow scenarios, data model, permission action codes, and status workflow. Later patches should still complete the design system, PDF/share model, test plan, roadmap, and Codex working rules before major implementation.

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
10. `docs/project/v2/08-feature-spec.md`
11. Later v2 canonical documents as they are created.
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

`0.30.0-alpha.4` clarifies and corrects the 0.30.0-alpha.3 data/permission/status baseline. `0.30.0-alpha.3` extended the design baseline with data model, permission action codes, and status workflow principles after the 0.30.0-alpha.2 role/workflow baseline.

It must not include:

- DB migration.
- API implementation.
- Route rewrites.
- Production behavior changes.
- R2 mutation.
- Large file movement or deletion.
- UI implementation beyond later planned `/ui` showroom work.

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
