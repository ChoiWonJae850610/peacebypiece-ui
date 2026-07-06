# WAFL v2 Operational Policy Absorption - 0.30.0-alpha.12

## Purpose

This document absorbs the P0/P1 findings from `docs/project/v2/13-v1-gap-review.md` into the active WAFL v2 baseline before Codex implementation starts.

The purpose is not to restore the v1 workorder-centered product model. The purpose is to preserve confirmed SaaS, security, DB, R2, PDF, billing, signup, deletion, QA, and production-guard policies while WAFL v2 moves the product center to Product/Style, WAFL Sheet, and Sheet Card.

## Absorption rule

```text
WAFL v2 changes the product and screen model.
WAFL v2 does not reset commercial, operational, security, storage, deletion, QA, or production safety policy.
```

Codex must treat this document as active authority after the gap review. If a v2 document and an older v1/productization document disagree, apply this order:

1. v2 product/screen/object wording wins for Product, WAFL Sheet, Sheet Card, Assistant, and mobile card flow.
2. Confirmed operational safeguards from v1/productization docs remain active unless a v2 document explicitly replaces them.
3. Workorder-centered UI assumptions are reference only and must not be copied into v2 workspace implementation.
4. DB/R2/Worker/PDF/security/destructive-operation safeguards are not reference-only; they are active operational constraints.

## P0 absorbed policies

### Commercial onboarding / Trial / approval / provisioning

Active v2 rule:

- Public signup, consent capture, application review, system-admin approval, customer-company provisioning, pending/service-paused states, and Trial handling remain required product behavior.
- WAFL v2 must not bypass the existing system-admin approval path just because the workspace center changes from workorder to Product/Sheet.
- A customer company must still be provisioned before customer-admin/designer/inventory-manager workspace access.
- Any v2 route that creates Product/Sheet data must be tenant-bound to a provisioned company membership.
- External factory/supplier recipients remain share-link recipients during alpha, not first-class login roles.

Implementation boundary:

- No signup/provisioning API rewrite is authorized by this document.
- No production signup, Trial, billing, or approval behavior may change without a separate explicit work order.

### Billing / plan / storage quota

Active v2 rule:

- Plan, subscription, storage quota, storage usage, storage add-on, paused-company access, and system-admin billing operations remain active product requirements.
- v2 image/sketch/PDF/share features must be quota-aware because they increase R2 usage.
- Storage usage must be tracked through app metadata and system-admin/customer-admin views, not by exposing raw R2 object details to ordinary users.
- A high-storage seed/test company remains required before real QA of representative images, sketches, attachments, and PDF snapshots.

Implementation boundary:

- No live PG/payment provider integration change is authorized.
- No quota enforcement change is authorized until a specific storage/billing work order lists DB/API/UI effects.

### DB source-of-truth / migration / tenant isolation

Active v2 rule:

- Neon remains the metadata and business-state source of truth.
- R2 stores file objects; it does not replace Neon metadata, permission, event, status, or tenant boundary records.
- v2 must use a hybrid schema: core tables, typed card-detail tables, and limited JSON metadata.
- Pure `data_json` storage for Sheet/Card state is not acceptable for the core product.
- Every Product, Sheet, Card, File, PDF snapshot, share link, event, and inventory movement must be scoped to a company/tenant boundary.
- Migration work requires read-only audit first, explicit migration plan, rollback stance, dev/test validation, and production guard.

Implementation boundary:

- This alpha.12 patch authorizes no DB migration.
- Codex may draft types or mock data only when the work order explicitly says DB migration is `없음`.

### R2 / Worker / file lifecycle

Active v2 rule:

- Users do not handle raw R2 URLs, object keys, Worker PUT calls, or signed URL internals.
- Upload, download/view, delete, restore, PDF generation, and cleanup must go through app API or Worker-controlled request flow.
- File metadata must be recorded in Neon before/with R2 object lifecycle operations according to the relevant API flow.
- Representative image, sketch, attachment, temporary PDF, review PDF, shared snapshot PDF, final PDF, revoked/expired share, and deleted/restored file states must remain distinguishable.
- File lifecycle operations must produce events/audit records where appropriate.

Implementation boundary:

- This alpha.12 patch authorizes no R2 mutation, Worker deployment, or PDF Worker change.
- Any future `/ui` showroom work must use mock visuals only and must not call upload/PDF APIs.

### Production guard / destructive operation guard

Active v2 rule:

- Production mutation, destructive reset, destructive seed, purge, R2 cleanup, DB migration, and account deletion flows require explicit guard checks.
- Dev/test seed and reset are allowed only in dev/test contexts with clear confirmation rules.
- PowerShell menu additions must label each action as safe, dry-run, dev/test-only, destructive, or production-blocked.
- Before 1.0, `master` remains the single development/QA branch and Vercel deployment is used for real-device QA after local/build/contract checks pass.

Implementation boundary:

- This alpha.12 patch authorizes no destructive script/menu execution.

## P1 absorbed policies

### v1 workorder feature mapping to v2

Mapping standard:

```text
v1 workorders                       -> v2 products / sheets / sheet_cards
v1 workorder attachments            -> v2 files with role: representative_image / sketch / attachment
v1 workorder generated PDFs         -> v2 pdf_snapshots and share_links
v1 material-orders                  -> v2 fabric/accessory card order actions plus secondary inquiry screens
v1 permissions                      -> v2 action_codes and role_permissions
v1 inventory logs                   -> v2 inventory_movements and events
v1 status history                   -> v2 sheet/card status events
```

Rule:

- Preserve the business capability, not the old screen layout.
- Do not keep a separate module as the main v2 workflow when the v2 Sheet Card model should own the action.
- Secondary inquiry/management screens may remain for search, audit, operations, and bulk management.

### System default catalog / categories / sizes / units

Active v2 rule:

- System default product categories, process standards, size/POM standards, and units remain required.
- Underwear and accessories remain default-provided but initially inactive optional product categories for new customers unless a later policy changes that.
- Customer-specific overrides must not corrupt system defaults.
- Sheet cards should reference catalog/unit/size standards instead of inventing free-form definitions where structured standards already exist.

Implementation boundary:

- This alpha.12 patch authorizes no catalog seed, migration, or default-data mutation.

### Admin operations and account lifecycle

Active v2 rule:

- 시스템관리자 screens remain responsible for customer-company approval/status, signup applications, storage usage, billing operations, audit logs, standards, and operational diagnostics.
- 고객사 관리자 screens remain responsible for company settings, members/permissions, partners, catalog settings, subscription/storage visibility, workspace operations, and legal/settings views.
- v2 Product/Sheet workspace must not remove existing admin/account lifecycle obligations.

Implementation boundary:

- This alpha.12 patch authorizes no system/customer admin route replacement.

### Company export / deletion / restore / purge

Active v2 rule:

- Company data export, deletion request, restore window, automatic deletion, purge eligibility, and file cleanup remain active product requirements.
- v2 Product/Sheet/Card/File/PDF/Share/Event tables must be included in future export/deletion planning.
- Final PDFs and shared snapshots need explicit retention rules before purge implementation.

Implementation boundary:

- This alpha.12 patch authorizes no export, delete, restore, purge, or cleanup execution.

### Product completion evidence

Active v2 rule:

- Future v2 implementation patches must report product completion evidence, not just “build passed”.
- Evidence should include changed screen/route, permission behavior, QA command result, remaining manual QA, and real-device QA items where relevant.
- For `/ui` showroom work, evidence must include desktop/mobile route review targets and the exact component samples added.

Implementation boundary:

- This alpha.12 patch is documentation/version only, so evidence is static inspection plus patch artifact verification.

### PowerShell automation follow-up

Future v2 PowerShell/dev-test menu candidates remain required follow-up items, not silent implementation:

```text
V2 Seed Plan Validate                 safe / dry-run
V2 Seed Apply                         dev-test-only / confirmation required
V2 Seed Reset                         destructive / dev-test-only / explicit confirmation required
V2 R2 Usage Scenario Seed             dev-test-only / production R2 blocked
V2 Mobile QA Checklist                safe / report/export only
V2 Product Completion Evidence Export safe / report/export only
```

Rule:

- Do not add destructive commands silently.
- Do not run destructive commands from ChatGPT/Codex unless the user explicitly confirms the exact operation and environment.

## Codex readiness after absorption

After this alpha.12 absorption patch:

```text
Product definition: ready for narrow implementation.
Screen model: ready for /ui showroom prototype.
Design system: ready for /ui showroom prototype.
Permission/action code model: ready for mock catalog/type draft only.
Status model: ready for mock catalog/type draft only.
PDF/share model: ready for mock UI only; Worker/R2 mutation blocked.
DB model: design baseline only; migration blocked.
Seed/test model: design baseline only; mutation blocked.
Operational policy: preserved and absorbed.
Broad workspace implementation: still blocked.
```

Recommended first Codex work after alpha.12:

```text
0.30.0-alpha.13 - /ui v2 showroom prototype, mock-only, no DB, no R2, no Worker, no production behavior change.
```

Alternative if the owner wants one more low-risk step:

```text
0.30.0-alpha.13 - docs consistency audit only, no UI/code behavior changes.
```

## Owner decision points still open

These should not block `/ui` mock showroom work, but they must be decided before DB/API/migration implementation:

1. Exact commercial plan names and storage quota numbers.
2. Trial duration and Trial-to-paid conversion behavior.
3. Final PDF retention count/duration and purge policy.
4. Whether reorder creates a new Sheet under the same Product or a new Product variant by default.
5. Which Product/Sheet fields are mandatory for `준비됨(ready)` versus merely warned.
6. Which mobile QA devices are mandatory before external tester handoff.

## Alpha.12 implementation boundary

This patch is documentation/version/prompt-preparation only. It does not authorize:

```text
- DB migration
- API implementation
- workspace route replacement
- production behavior change
- R2 mutation
- Worker deployment
- PDF generation change
- package dependency change
- destructive seed/reset/purge
- v1 document deletion or movement
```
