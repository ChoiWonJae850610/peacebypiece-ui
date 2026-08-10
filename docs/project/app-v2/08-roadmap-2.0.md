# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.60

Status: `ALPHA60_DRAFT_COMPONENT_HARD_DELETE_AND_SHARED_ARCHITECTURE_RULES_COMPLETE`.

Alpha.60 replaces only the current normal delete path for eligible WorkOrder-local rows in an editable, unissued draft:

- eligible size, color, fabric, and accessory rows are physically deleted rather than archived;
- deleting a size or color removes its dependent quantity cells and synchronizes WorkOrder/Revision total quantity from the surviving matrix sum in the same transaction;
- requested, cancelled-after-request, completed, issued-revision, and legacy archived rows remain protected by order history and Revision/Event evidence;
- normal mobile material deletion does not create a new `archived_at` tombstone;
- system/company/master library lifecycle remains separate and receives no mutation from this WorkOrder-local flow;
- legacy archive schema/routes remain bounded compatibility debt and are not purged or dropped;
- the shared-architecture working rule is owned once by the canonical Permanent Rules owner and verified by its canonical contract.

The single automated Runtime, canonical shared-architecture contract, owner-approved equivalent isolation evidence, bundled Node 24 Canonical Verify, and physical-iPhone QA passed. The owner confirmed the `250→150→250→200` quantity sequence, size/color and fabric/accessory hard deletes, cancel-preserved material, background/re-entry, and one Development Client Reload without blocking UI failure. Finalization captured that exact state, removed only the isolated QA fixture with mutable residual zero, preserved append-only Event/Receipt evidence, synchronized `APP_VERSION` to `2.0.0-alpha.60`, and produced the normal Git/artifact delivery. Alpha.51 and alpha.56 remain immutable historical evidence.

Evidence: `60-draft-child-hard-delete-and-shared-architecture-evidence.md`.

## Previous result — 2.0.0-alpha.59

Status: `ALPHA59_MOBILE_WORK_ORDER_INPUT_EXPANSION_COMPLETE`.

Alpha.59 completes the Maker mobile WorkOrder input expansion on the accepted alpha.58 size/color read-only baseline:

- draft-only size, color, and quantity commands preserve tenant, permission, expectedVersion, idempotency, conflict, event/receipt, and stable-identity boundaries;
- compact size/color actions, sequential multi-add, deterministic automatic sorting, color palette selection, stable row selection, and parent/child editor lifecycle extend the read model without duplicating it;
- quantity updates transactionally synchronize matrix totals, WorkOrder integer total quantity, and revision snapshots while unchanged updates remain no-ops;
- circular finite-option reels provide modulo identity, central recentering, logical callback/haptic dedupe, and stable selection for target, category, size, color, and unit;
- material and accessory fields use one same-position inline implementation with exact session ownership, stale-blur protection, one-action/one-request behavior, recovery, and quarter-decimal required/allowance input;
- final caret, label, compact-action, cost/image/memo, same-item session, and nested palette corrections were accepted on a physical iPhone;
- automated Runtime QA used one isolated dev/test draft, preserved user products as GET-only, verified the `3/3/9/5/15` read-only projection, and left temporary residuals and user/migration/R2/production mutations at zero;
- size/color archive/restore, fractional total quantity, finished-measurement editing, company common colors, Factory, schema/migration, dependency/native/EAS, R2, and production remain excluded.

Evidence: `59-mobile-work-order-input-expansion-evidence.md`.

## Previous result — 2.0.0-alpha.58

Status: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`.

Maker mobile size/color and finished-measurement read models, bounded read controller/cache, matrix and measurement presentation, local-only unit conversion, read-only policy, and accepted physical-iPhone UX remain complete. Detailed facts are preserved in `58-mobile-size-color-readonly-evidence.md`.

## Previous overview result — 2.0.0-alpha.57

Status: `ALPHA57_MOBILE_OVERVIEW_CATEGORY_INLINE_INPUT_COMPLETE`.

Maker mobile WorkOrder images/attachments, overview and Category structure, button-free inline input, numeric-draft correction, and accepted material/accessory presentation remain complete. Detailed facts are preserved in `57-mobile-overview-category-inline-input-evidence.md`.

## Previous accessory result — 2.0.0-alpha.56

Status: `ALPHA56_ACCESSORY_LIFECYCLE_PARITY_COMPLETE`.

Accessory Read/create/update/archive/restore and request/cancel/re-request/complete parity, physical-iPhone acceptance, and the shared fabric lifecycle remain complete. Detailed facts are preserved in `56-mobile-accessory-lifecycle-parity-evidence.md`.

## Previous material-order result — 2.0.0-alpha.55

Status: `ALPHA55_MATERIAL_ORDER_CANCELLATION_MEMO_IME_AND_RUNTIME_QA_COMPLETE`.

Fabric request/cancel/re-request/complete, stock-covered zero-order, memo IME finalization/disclosure, fixed material headers, and physical-iPhone acceptance remain complete. Detailed facts are preserved in `55-mobile-material-order-lifecycle-evidence.md`.

## Previous architecture result — 2.0.0-alpha.53

Status: `ALPHA53_MOBILE_ARCHITECTURE_FOUNDATION_COMPLETE`.

Composition, feature UI, application controller, domain contract/policy/validation, formatter/theme, and API infrastructure boundaries remain complete. Detailed facts are preserved in `52-mobile-architecture-foundation-evidence.md`.

## Previous product result — 2.0.0-alpha.51

Status: `ALPHA51_MOBILE_MATERIAL_SOFT_DELETE_RESTORE_LIFECYCLE_COMPLETE`.

Recoverable draft material archive/restore, active/archived visibility, lifecycle concurrency, mobile recovery, and hard-DELETE blocking remain complete. Detailed facts are preserved in `50-mobile-material-soft-delete-restore-lifecycle-evidence.md`.

## Previous infrastructure result — 2.0.0-alpha.49

Status: `ALPHA49_CANONICAL_CODEX_INSTRUCTION_ARCHITECTURE_COMPLETE`.

Permanent Rules, Current Baseline, Version Delta, Immutable Evidence, responsibility routing, and compact future work orders were established without changing product Runtime behavior. Full facts remain in `48-canonical-codex-instruction-architecture-evidence.md`.

## Recent immutable evidence index

| Version | Result | Evidence |
| --- | --- | --- |
| alpha.43 | external mobile QA and iOS Development Build | `40-external-mobile-qa-foundation-evidence.md`, `42-ios-development-build-evidence.md` |
| alpha.44 | mobile real-data read-only slice | `43-mobile-real-data-read-only-evidence.md` |
| alpha.45 | ProductionCard core overview | `44-mobile-production-card-core-overview-evidence.md` |
| alpha.46 | mobile basic-info update and date-only correction | `45-mobile-basic-info-update-evidence.md` |
| alpha.47 | Tailscale Serve developer auto-connect | `46-mobile-tailscale-serve-developer-auto-connect-evidence.md` |
| alpha.48 | mobile material real Read | `47-mobile-materials-real-read-evidence.md` |
| alpha.49 | canonical Codex instruction architecture | `48-canonical-codex-instruction-architecture-evidence.md` |
| alpha.50 | mobile material draft create/update | `49-mobile-material-draft-create-update-evidence.md` |
| alpha.51 | mobile material soft-delete/restore lifecycle | `50-mobile-material-soft-delete-restore-lifecycle-evidence.md` |
| alpha.52 | mobile core inline UX, calculation, list, and date | `51-mobile-core-inline-ux-calculation-list-date-evidence.md` |
| alpha.53 | mobile architecture foundation | `52-mobile-architecture-foundation-evidence.md` |
| alpha.54 | mobile Reel Picker input UX | `53-mobile-reel-picker-input-ux-evidence.md` |
| alpha.55 | material order cancellation, zero-order, memo IME, and Runtime QA | `55-mobile-material-order-lifecycle-evidence.md` |
| alpha.56 | accessory lifecycle parity and physical-iPhone acceptance | `56-mobile-accessory-lifecycle-parity-evidence.md` |
| alpha.57 | mobile overview, Category, image, and inline input | `57-mobile-overview-category-inline-input-evidence.md` |
| alpha.58 | mobile size/color read-only foundation and final UX | `58-mobile-size-color-readonly-evidence.md` |
| alpha.59 | mobile WorkOrder input expansion and editor lifecycle | `59-mobile-work-order-input-expansion-evidence.md` |
| alpha.60 | draft-child hard delete and shared-architecture completion | `60-draft-child-hard-delete-and-shared-architecture-evidence.md` |
| maintenance | canonical Codex rule normalization without APP_VERSION change | `54-canonical-codex-working-rules-normalization-evidence.md` |

Older results remain in numbered evidence files indexed and task-routed by `00-start-here.md`. Their detailed outcomes are not duplicated here.

## Version Delta owner contract

Every new version begins with a short owner-approved Delta. Alpha.55 and later use `09e-codex-version-delta-template.md`; the attached or pasted `SELF-EXECUTING HANDOFF` itself authorizes immediate preflight. It must contain:

| Field | Required content |
| --- | --- |
| Execution | model, reasoning, speed |
| Baseline | version, exact HEAD/origin expectation, clean-state expectation |
| Result | result version and target status |
| Objective | one bounded user or infrastructure outcome |
| Included scope | exact components/routes/docs/data effects |
| Non-goals | explicit adjacent exclusions |
| Mutation | allowed DB/business/R2/PDF/token/schema/native/EAS effect budget |
| Boundaries | UI/API/DB/tenant/security/transport constraints |
| Runtime/QA | required runner, preflight, device/user judgment, or explicit `NOT_REQUIRED` |
| Contracts | new and regression tests plus Verify profile |
| Completion | all gates required before status/commit/artifacts |
| Commit | candidate message |
| Next | next-version boundary |
| Permanent Rules | standard reference to `09-codex-working-rules.md` |

Standard reference:

> 실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.

The Delta does not repeat Permanent Rules, PC-audit mechanics, runner internals, generic Failure Handoff fields, or generic Git/artifact procedures. Those remain owned by `09a` through `09d`. An omitted exceptional authority remains forbidden.

## Next candidate — 2.0.0-alpha.61

Status: `not started`.

This heading is canonical routing metadata only. It grants no alpha.61 product authority; alpha.60 finalization remains the only active work.

Separate owner-approved packages may consider one bounded adjacent objective at a time after alpha.60 finalization:

- any broader archive/restore lifecycle beyond the preserved legacy compatibility surface, including schema, impact counts, read-model, conflict, and restore-name/code policy;
- fractional total-quantity policy, including matrix compatibility, historical data, list/overview/PDF/issue behavior, and migration;
- finished-measurement editing with stable size/POM identity and explicit persistence policy;
- company common color library with tenant ownership and WorkOrder snapshot rules.

None of these candidates is implied by the alpha.60 hard-delete scope. Factory, AI image generation, production mutation, R2 mutation, dependency/native/EAS work, and unrelated expansion remain outside the boundary unless a future owner-approved Delta explicitly includes them.
