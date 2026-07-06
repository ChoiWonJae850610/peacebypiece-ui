# WAFL v2 Roadmap 0.30 - 0.30.0-alpha.12

## Purpose

This document defines the active WAFL v2 `0.30.x` redesign roadmap.

The `0.30.x` line is not a continuation of the `0.24.x` workorder-form productization line. It keeps operational safeguards from the existing product, but the product model is reset around:

```text
Product / Style
→ WAFL Sheet
→ Sheet Card
→ Assistant
→ PDF/share
→ reorder / inspection / inventory / history
```

## Current infrastructure assumptions

- App: Next.js App Router, TypeScript, Tailwind CSS.
- DB: Neon.
- File storage: Cloudflare R2.
- File/PDF access: Worker/API controlled flow, not raw browser-managed R2 access.
- Deployment: GitHub `master` + Vercel.
- QA: dev/test environment first, production protected.
- Branch policy before 1.0: `master` remains the single development/QA branch because Vercel deployment is needed for real-device QA.

## Version flow

### 0.30.0-alpha.1 - Product foundation

Status: done.

- v2 product definition.
- Product/Style, WAFL Sheet, Sheet Card center model.
- PC / tablet / mobile screen skeleton.
- First user decisions recorded.

### 0.30.0-alpha.2 - Role and workflow foundation

Status: done.

- Korean role baseline.
- User flow from creation to reorder.
- External partner as share-link recipient in alpha.

### 0.30.0-alpha.3 - DB / permission / status foundation

Status: done.

- Neon data model draft.
- Permission action-code model.
- Sheet/Card status split.

### 0.30.0-alpha.4 - Korean role/status and Neon/R2 correction

Status: done.

- 시스템관리자, 고객사 관리자, 디자이너, 재고관리.
- Korean labels first, English internal codes second.
- Neon and R2 clarified.

### 0.30.0-alpha.5 - Design system foundation

Status: done.

- v2 design system document.
- `/ui` as Figma-style showroom.
- Concept image as moodboard only.

### 0.30.0-alpha.6 - PDF/share foundation

Status: done.

- PDF as Sheet snapshot.
- Controlled share link.
- Kakao API deferred.

### 0.30.0-alpha.7 - PDF/R2/Worker lifecycle correction

Status: done.

- Worker/API controlled file lifecycle.
- temporary/review/shared/final PDF distinction.
- Raw R2 access prohibited.

### 0.30.0-alpha.8 - Mobile web interaction and QA baseline

Status: done.

- iPhone input zoom prevention.
- Korean IME focus stability.
- modal/drawer/bottom-sheet behavior.
- orientation and safe-area QA.

### 0.30.0-alpha.9 - Seed/test scenario baseline

Status: done.

- dev/test-only seed matrix.
- Neon metadata and R2/Worker file scenarios.
- mobile QA, PDF lifecycle, inventory scenarios.

### 0.30.0-alpha.10 - Document governance and Codex-entry baseline

Status: done.

- v1 keep/rewrite/archive classification.
- active v2 Codex read order.
- 0.30 roadmap.
- Codex working rules.

### 0.30.0-alpha.11 - v1-docs gap review baseline

Status: done.

- Compare v2 first-pass documents with existing v1/pre-v2 project docs.
- Confirm v2 product direction while preserving confirmed SaaS, DB, R2, PDF, billing, signup, deletion, QA, and production safety policies.
- Add `docs/project/v2/13-v1-gap-review.md`.
- Record v1 workorder-domain to v2 Product/Sheet/Card mapping.
- Identify blockers before broad Codex implementation.

### 0.30.0-alpha.12 - Operational policy absorption and first Codex gate

Status: current.

- Add `docs/project/v2/14-operational-policy-absorption.md`.
- Absorb gap-review P0/P1 findings into the active v2 baseline.
- Preserve signup/Trial/provisioning, billing/storage, Neon source-of-truth, tenant isolation, R2/Worker lifecycle, production guard, catalog/size/unit, account lifecycle, export/deletion/restore/purge, QA evidence, and PowerShell automation policy.
- Add `docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md` as the recommended first narrow Codex work order.
- Keep broad workspace implementation, DB migration, API changes, R2/Worker mutation, and production behavior changes blocked.

## Next recommended sequence

### 0.30.0-alpha.13 - `/ui` v2 showroom prototype or final docs consistency audit

Recommended mode: Codex medium for document sync, Codex medium-high for `/ui` prototype.

Preferred Option A - `/ui` showroom prototype:

- Use `docs/codex-prompts/0.30.0-alpha.13-v2-ui-showroom-prototype.md`.
- Implement mock-only v2 design system samples in `/ui`.
- Include WAFL Sheet, Sheet Card, Assistant, mobile card flow, input, status, upload/image, PDF-like preview, and Do/Don’t samples.
- No DB migration.
- No API implementation.
- No R2/Worker mutation.
- No production behavior change.

Fallback Option B - docs consistency audit only:

- Re-check `docs/project/v2/*` for contradictions after alpha.12.
- No app behavior changes.

### 0.30.0-alpha.14+ - Implementation planning

Implementation must be phased:

1. shared types and action-code catalog,
2. mock-only v2 Sheet prototype,
3. `/ui` showroom validation,
4. dev/test seed implementation,
5. Neon migration design,
6. API and Worker integration,
7. workspace route migration.

## Implementation gates

Codex must not perform broad implementation until all of these are true:

```text
- v2 docs are read and conflict-reviewed.
- user confirms the next phase.
- allowed files are listed.
- forbidden files are listed.
- DB migration 여부 is explicit.
- R2/Worker mutation 여부 is explicit.
- production guard is explicit.
- test commands are explicit.
- rollback/patch rule is explicit.
```

## Roadmap status summary

```text
Design baseline: first pass complete at 0.30.0-alpha.10; operational policy absorbed at 0.30.0-alpha.12
Implementation readiness: not yet
Recommended next: first narrow Codex work order, preferably `/ui` showroom prototype
Codex broad implementation: blocked
Codex narrow document sync: allowed after work order
Codex /ui showroom prototype: allowed by explicit alpha.13 work-order draft
DB migration: blocked until explicit migration plan
R2/Worker mutation: blocked until explicit work order
Production behavior change: blocked
```
