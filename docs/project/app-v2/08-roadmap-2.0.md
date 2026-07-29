# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.58

Status: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`.

Alpha.58 completes the Maker mobile size/color read-only foundation and final UX on the accepted alpha.57 WorkOrder baseline:

- the existing `/size-color` and `/size-spec` routes remain strict GET-only reads with UUID, method, tenant, anonymous, foreign-workspace, and unsupported-query boundaries;
- mobile response normalization and the feature-owned controller verify WorkOrder/revision/entityVersion consistency, dedupe in-flight reads, prevent stale commits, isolate WorkOrder/session transitions, and use version-aware bounded cache entries;
- the read-only screen presents the size/color quantity matrix, totals, POM-based finished measurements, rich and empty states, retry, and local-only `cm | inch` display;
- cm/inch conversion, nearest one-eighth-inch display, same-unit cm trailing-zero normalization, stored value preservation, matrix totals, and zero mutation actions are behaviorally contracted;
- final visual alignment, common gutter/typography, one canonical read-only badge, shared tab states, and delayed loading remove development copy without changing the accepted matrix or measurement design;
- automated and read-only Runtime QA verifies the rich `3/3/9/5/15` fixture, read/security boundaries, compiled mobile bundle, deterministic before/after snapshots, and zero observed domain/migration/size-table delta;
- source-quality audit and bounded refactor findings were resolved without widening the Experience/Overview surface or starting edit behavior;
- owner physical-iPhone QA accepted the read behavior, unit display, visual alignment, refactor regression, and final UX cleanup;
- size/color/quantity/measurement CRUD, automatic total-quantity mutation, Factory, migration, fixture mutation, dependency/native/EAS, R2, and production remain excluded.

Evidence: `58-mobile-size-color-readonly-evidence.md`.

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

## Next candidate — 2.0.0-alpha.59

Candidate objective: Maker mobile size/color structure editing only after owner approval.

Potential included scope, subject to the actual alpha.58 Delta:

- add, rename, archive, restore, and reorder size and color structure on draft WorkOrders;
- require canonical expectedVersion, conflict handling, failed-save restore, tenant/permission enforcement, and one-action/one-request behavior;
- preserve the completed read-only screen as a sibling boundary instead of folding write state back into it.

Explicitly separate later scope:

- quantity-matrix editing, finished-measurement editing, templates, and automatic total-quantity changes remain excluded;
- schema/migration, Factory, production deployment/mutation, dependency/native/EAS, and unrelated feature expansion remain excluded unless the future Delta explicitly establishes a separate authority.

Alpha.59 does not start merely because it is listed here. It begins only with its owner-approved self-executing Version Delta and the final synchronized alpha.58 HEAD.
