# WAFL v2 v1-docs Gap Review - 0.30.0-alpha.11

## Purpose

This document compares the first-pass WAFL v2 design documents with the pre-existing v1 / `0.24.x` project documents.

The goal is not to keep the old workorder-centered product direction. The goal is to prevent v2 from accidentally losing confirmed business, security, billing, DB, R2, PDF, signup, deletion, QA, and operations rules that are still valid.

## Review scope

Reviewed source groups:

```text
AGENTS.md
docs/codex-current-state.md
docs/productization-roadmap.md
docs/project/05-productization-bible.md
docs/project/06-architecture-guide.md
docs/project/07-wafl-component-standard.md
docs/project/09-pdf-specification.md
docs/project/10-r2-storage-policy.md
docs/project/11-admin-operations-design.md
docs/project/13-qa-matrix.md
docs/project/14-playwright-plan.md
docs/project/15-browser-device-matrix.md
docs/project/19-system-default-catalog-and-seed-spec.md
docs/project/20-customer-signup-consent-approval-trial-spec.md
docs/project/25-korean-unicode-encoding-standard.md
docs/project/26-final-policy-decisions-and-master-todo.md
docs/project/27-database-schema-query-permission-audit.md
docs/project/28-database-source-of-truth-safe-migration-design.md
docs/project/29-db-readonly-audit-menu-standard.md
docs/project/32-product-completion-and-ui-evidence-standard.md
docs/project/33-public-signup-schema-repository-prep-0.24.26.md
docs/project/33-workorder-pdf-size-dashboard-finalization.md
```

Existing v1 documents remain useful in two different ways:

1. active operational rules that v2 must keep; and
2. v1 implementation references that v2 may replace after explicit mapping.

## Overall conclusion

The v2 direction is still correct:

```text
Product / Style
→ WAFL Sheet
→ Sheet Card
→ Assistant
→ PDF/share
→ reorder / inspection / inventory / history
```

But the v2 first-pass documents must absorb more of the old project’s productization and SaaS operation requirements before Codex starts implementation.

The most important correction is this:

```text
v2 replaces the product center and screen model.
v2 does not erase confirmed commercial, signup, billing, storage, deletion, DB safety, R2, PDF, QA, or production guard policies.
```

## Gap severity legend

```text
P0 = must be preserved before any implementation work
P1 = must be specified before DB/API/screen implementation
P2 = can be deferred but must remain visible on roadmap
Reference = useful old detail; do not copy blindly
Archive = historical or one-off document; do not drive v2
```

## Confirmed rules that v2 must preserve

| Area | Existing confirmed rule | v2 handling |
| --- | --- | --- |
| Brand | Final brand is WAFL. | Preserve. |
| Domain/public entry | Public website, signup, login entry, support/inquiry entry exist. | Preserve as SaaS shell around v2 workspace. |
| Trial | Trial is 7 days with 100MB and 3 members. | Preserve unless owner later changes business policy. |
| Plans | Lite / Flow / Studio / Custom plan model exists with storage/member/export limits. | Preserve as billing/subscription baseline. |
| Storage add-on | Additional storage is an add-on, not merely a temporary bridge. | Preserve and integrate with R2 quota. |
| Card registration | Trial signup requires card registration before approval. | Preserve as pre-production/legal-review policy. |
| Signup approval | System administrator approval starts Trial and provisioning. | Preserve. |
| Catalog | System categories are immutable to customers; customers can enable/disable or add custom categories. | Preserve in v2 Product/Style category model. |
| Underwear/accessory | Provided by default but disabled unless customer activates. | Preserve. |
| Size/POM | Size systems and measurement templates must be structured, not ad-hoc. | Preserve in Sheet card design. |
| DB source of truth | Membership, billing, file ownership, PDF final, deletion jobs, audit logs need canonical owners. | Preserve before migration. |
| DB migration | Read-only audit and reconciliation before destructive migration. | Preserve. |
| R2 | Tenant isolation, object-key contract, quota accounting, retention, access control. | Preserve; v2 uses Worker/API controlled flow. |
| PDF | PDF generation, retention, regeneration, failure, storage-full behavior must be explicit. | Preserve and map into v2 PDF lifecycle. |
| QA evidence | Product completion needs browser/device evidence and UI proof, not only build pass. | Preserve. |
| Production guard | Dev/test destructive operations must not run in production. | Preserve. |
| Patch automation | Flat patch ZIP and exact `commit-meta.md` tokens are required. | Preserve. |

## Missing or weak v2 coverage

### P0. Commercial onboarding / Trial / approval / provisioning

v2 documents currently focus on the workspace, but a SaaS product also needs the customer entry pipeline.

Required v2 absorption:

```text
public site → signup request → consent evidence → payment method/card registration
→ system-admin review → approval/provisioning → Trial starts
→ first customer administrator enters workspace
```

v2 must explicitly preserve:

- customer signup request fields;
- business registration file handling;
- policy consent evidence;
- approval / rejected / needs-more-info states;
- idempotent company provisioning;
- first customer administrator membership;
- Trial quota and plan selection;
- default catalog, size, unit, role, and permission seed creation.

### P0. Billing / plan / storage quota

v2 makes images, sketches, PDF snapshots, and share links central. Therefore storage quota is more important in v2 than in v1.

Required v2 absorption:

```text
Trial: 100MB / 3 members / 7 days
Lite: 500MB / 3 members
Flow: 1.5GB / 10 members
Studio: 5GB / 30 members
Custom: negotiated
Additional storage: 1GB/month add-on
```

Implementation must not hard-code plan limits in random screen code. Plan/source-of-truth rules must be resolved through Neon catalog/subscription tables.

Storage-full behavior must handle:

- representative image upload;
- sketch upload;
- attachment upload;
- temporary PDF generation;
- final PDF snapshot;
- share-link creation;
- R2 trash/restore/purge.

### P0. DB source-of-truth and migration safety

The v2 data model is correct in direction, but implementation must not skip v1 DB reconciliation.

Required v2 absorption:

```text
users = identity/profile only
company membership = canonical company/role membership
subscription = canonical billing lifecycle
plans = catalog
files = file metadata and ownership
pdf snapshots = generated-document metadata
events/audit = operational evidence
deletion jobs = deletion execution authority
```

Do not trust legacy `users.company_id` or `users.role` after canonical membership cutover.

Before migration:

- inventory current runtime reads/writes;
- run read-only audits;
- reconcile conflicts;
- implement compatibility fallback only if needed;
- avoid dual-authority writes;
- validate constraints only after zero-violation checks;
- keep rollback path.

### P0. R2 / Worker / file lifecycle

v2 must keep the existing rule:

```text
R2 is storage.
The browser does not manage raw R2 object access.
WAFL app API or Worker-controlled flow owns upload, delete, restore, view, and purge behavior.
Neon stores file metadata and ownership.
```

Required metadata:

```text
company_id
owner_type
owner_id
file_type
storage_class
r2_object_key
size_bytes
mime_type
created_by
deleted_at
purged_at
pdf_snapshot_id when applicable
```

Any R2 mutation work order must require reading:

```text
docs/project/10-r2-storage-policy.md
cloudflare/README.md
cloudflare/r2-upload-worker.js
cloudflare/pdf-generator-worker/
```

### P0. Production guard / destructive operation guard

v2 seed/reset/export/cleanup/R2 usage scenarios must remain dev/test-only unless explicitly production-safe.

Destructive operations requiring explicit confirmation:

```text
DB reset
DB seed apply
R2 test-object creation
R2 purge
trash purge
customer deletion execution
migration write
production Worker mutation
```

### P1. v1 workorder feature mapping to v2

Codex must not delete or ignore v1 functionality until it is mapped.

| Existing v1 route/domain | v2 mapping | Notes |
| --- | --- | --- |
| `/workspace/workorders` | `/workspace` Sheet-centered workspace | Main runtime target after prototype. |
| `workorders` API | products / sheets / sheet_cards API | Keep compatibility only if needed during migration. |
| workorder attachments | files + image/sketch/attachment roles | Representative image and sketch become core data. |
| generated workorder PDF | pdf_snapshots: workorder/factory/final | Must not overwrite final PDF silently. |
| generated order request PDF | PDF/share card action | Supplier/order PDF becomes card action. |
| `/workspace/material-orders` | Sheet fabric/accessory order actions + secondary inquiry screen | Not main flow. |
| `/workspace/materials` | material inventory / lookup / history | Still needed as support screen. |
| `/workspace/partners` | partners used by fabric/accessory/factory cards | Preserve. |
| `/workspace/members` | memberships + role permissions | Korean role baseline. |
| `/workspace/settings/catalog` | system catalog activation and customer custom catalog | Preserve catalog rules. |
| `/workspace/storage` | storage quota / R2 usage / cleanup view | Must remain visible. |
| `/system/*` | system-admin operations | Preserve and simplify after v2 UX target is fixed. |
| `/ui` | v2 design system showroom | Required before workspace rewrite. |
| `/functions` | action code / permission catalog | Replace function list concept. |
| `/roadmap` | v2 0.30 roadmap | Replace 0.24 roadmap authority. |
| `/dev/test-console` | dev/test seed/reset/role-switch/account-switch | Production blocked. |

### P1. System default catalog / categories / sizes / units

v2 Product/Style creation must keep v1 confirmed catalog rules.

Required v2 absorption:

- three-level apparel product categories;
- system categories cannot be renamed or deleted by customer;
- customers can enable/disable system categories;
- customers can create custom categories;
- underwear/accessory are provided but initially disabled;
- size spec and POM/measurement templates exist as structured standards;
- company overrides must not mutate global system defaults;
- seed/test data must include category activation variations.

### P1. Admin operations and account lifecycle

The v2 workspace redesign must not weaken the admin surface.

System administrator must handle:

- customer approval;
- customer status;
- plan/subscription view;
- R2/storage usage;
- join requests;
- signup application review;
- storage purge candidate review;
- audit logs;
- customer account deletion/restore/purge lifecycle.

Customer administrator must handle:

- company settings;
- member invite/manage;
- catalog activation;
- plan/storage view;
- workspace-level permissions;
- export/download if allowed by plan.

### P1. Company-wide export / deletion / restore

v2 documents need explicit export/deletion absorption because Product/Sheet/PDF/R2 centrality increases data volume.

Required v2 coverage:

```text
company export
limited export count by plan
withdrawal request
deletion candidate
deletion manifest
restore window
automatic purge schedule
R2 trash/restore/purge
audit evidence
```

Do not implement physical deletion in the same migration that introduces v2 schema.

### P1. Product completion evidence

v2 implementation must use completion evidence, not "it builds" only.

Required evidence:

```text
build/type check
Playwright or manual route evidence
console/network check
desktop/tablet/mobile screenshots
iPhone input zoom check
Korean IME focus stability check
modal/drawer scroll lock check
PDF preview/share evidence
role/permission evidence
R2/Worker evidence when file mutation is touched
repo-state clean after push
```

### P1. PowerShell automation follow-up

Future automation menu items must be tracked explicitly.

Candidate menu items:

```text
V2 Seed Plan Validate
- safe
- dry-run

V2 Seed Apply
- dev/test-only
- confirmation required

V2 Seed Reset
- destructive
- dev/test-only
- explicit confirmation required

V2 R2 Usage Scenario Seed
- dev/test-only
- production R2 prohibited
- confirmation required

V2 Mobile QA Checklist
- safe
- report/export only

V2 Docs Consistency Check
- safe
- markdown/read-order/version audit
```

### P2. Legal review and external services

Existing legal-review labels remain relevant:

- PG/provider selection;
- statutory refund rights;
- tax invoice / VAT details;
- privacy policy;
- business registration handling;
- cookie/analytics consent;
- marketing consent;
- external Kakao API use if added later.

v2 must not imply these are solved.

## Direction conflicts found

### Conflict 1. "v1 reference only" may be too weak for confirmed policy docs

`docs/project/26-final-policy-decisions-and-master-todo.md` contains confirmed business and policy decisions. It is v1 productization-era, but not merely old UI detail.

Correction:

```text
v1 screen/workorder assumptions are reference.
confirmed business/security/operations policies remain active until a v2 replacement explicitly supersedes them.
```

### Conflict 2. v2 Product/Style model could obscure customer signup/provisioning

The workspace center changed, but customer onboarding remains outside Product/Sheet.

Correction:

```text
v2 must define SaaS shell separately from workspace center:
public site / signup / approval / billing / system admin / workspace.
```

### Conflict 3. Sheet card flexibility can undermine DB source-of-truth

The v2 hybrid model is right, but `data_json` cannot become the hidden source for critical billing, inventory, PDF, or permission data.

Correction:

```text
Use typed detail tables for searchable/auditable production data.
Use JSON only for non-authoritative card metadata and layout-like details.
```

### Conflict 4. PDF final behavior must preserve "one current final" semantics

v2 allows multiple snapshots, but the UI may still need "latest/current final" clarity.

Correction:

```text
Keep immutable snapshot history.
Also define one current final PDF pointer/metadata per Sheet/document family when needed.
```

### Conflict 5. External partner role must stay share-link-only in alpha

v2 should not prematurely add external partner accounts.

Correction:

```text
External supplier/factory is share-link recipient in alpha.
Login-based partner portal is later roadmap.
```

## v2 documents to update after this review

High-priority follow-up updates:

```text
docs/project/v2/03-data-model.md
- Add source-of-truth matrix and migration invariants.

docs/project/v2/08-feature-spec.md
- Add SaaS shell features: signup, Trial, plan, storage, deletion/export.

docs/project/v2/09-test-plan.md
- Add business/operation QA: signup, subscription, storage limit, deletion/export.

docs/project/v2/10-roadmap-0.30.md
- Add alpha.11 gap review and required follow-up sequence.

docs/project/v2/12-codex-working-rules.md
- Require this gap review before implementation.
```

## Codex implementation blockers after gap review

Codex must not start broad implementation until these are resolved:

```text
1. v2 first implementation scope is narrowed to either docs sync or /ui showroom.
2. DB migration is still blocked until Neon read-only audit and source-of-truth reconciliation.
3. R2/Worker mutation is still blocked until explicit Worker/R2 work order.
4. Existing workorder route replacement is blocked until feature mapping is approved.
5. signup/billing/storage/deletion policies must remain visible even if not implemented in the first v2 prototype.
6. production mutation remains blocked.
```

## Recommended next sequence

```text
0.30.0-alpha.11
- v1 docs vs v2 docs gap review. This document.

0.30.0-alpha.12
- Update v2 data model / feature spec / test plan / roadmap with gap-review findings.

0.30.0-alpha.13
- Prepare first narrow Codex work order:
  A. docs consistency sync, or
  B. /ui v2 showroom prototype only.

0.30.0-alpha.14+
- Start narrow Codex implementation after owner confirms scope.
```

## Owner decision points

No immediate decision is forced by this review, but the following must be decided before implementation reaches DB/API level:

```text
1. Whether existing 0.24.x workorder routes are kept as compatibility routes during v2 prototype.
2. Whether v2 uses new tables side-by-side with legacy tables first, or migrates existing tables after audit.
3. Whether plan/storage policy remains exactly as 0.24.x confirmed values.
4. Whether company-wide export is required before first v2 customer trial.
5. Whether first Codex implementation target is /ui showroom or docs consistency sync.
```


## 0.30.0-alpha.12 absorption status

The P0/P1 findings from this review are absorbed into `docs/project/v2/14-operational-policy-absorption.md`.

Use that document as the active v2 implementation constraint for:

```text
- commercial onboarding / Trial / approval / provisioning
- billing / plan / storage quota
- Neon source-of-truth / migration safety / tenant isolation
- R2 / Worker / file lifecycle
- production and destructive-operation guard
- system catalog / size / unit standards
- admin account lifecycle
- company export / deletion / restore / purge
- product completion evidence
- PowerShell/dev-test automation follow-up
```

This does not unblock broad workspace implementation. It only makes the preserved operational policies explicit before the first narrow Codex work order.
