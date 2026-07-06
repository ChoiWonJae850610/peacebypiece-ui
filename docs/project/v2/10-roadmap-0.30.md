# WAFL v2 Roadmap 0.30 - 0.30.0-alpha.10

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

Status: current.

- v1 keep/rewrite/archive classification.
- active v2 Codex read order.
- 0.30 roadmap.
- Codex working rules.

## Next recommended sequence

### 0.30.0-alpha.11 - GPT consolidated design review

Recommended mode: GPT high reasoning.

Scope:

- Review all `docs/project/v2/*` for contradictions.
- Confirm Korean labels.
- Confirm DB/action/status/PDF/design/test alignment.
- Produce a Codex work order for document-only cleanup or `/ui` showroom prototype.
- Do not implement broad workspace changes yet.

### 0.30.0-alpha.12 - Codex document synchronization or /ui prototype gate

Recommended mode: Codex medium for document sync, Codex high for `/ui` prototype.

Option A - document sync only:

- Align `AGENTS.md`, `docs/codex-current-state.md`, v2 docs, and roadmap route metadata if needed.
- No app behavior changes.

Option B - `/ui` showroom prototype:

- Implement v2 design system samples in `/ui`.
- Include button/card/sheet/assistant/mobile/input/modal/drawer/toast/PDF-like preview.
- No DB migration.
- No production behavior change.

### 0.30.0-alpha.13+ - Implementation planning

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
Design baseline: first pass complete at 0.30.0-alpha.10
Implementation readiness: not yet
Recommended next: GPT consolidated review
Codex broad implementation: blocked
Codex narrow document sync: allowed after work order
Codex /ui showroom prototype: allowed after work order
DB migration: blocked until explicit migration plan
R2/Worker mutation: blocked until explicit work order
Production behavior change: blocked
```
