# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.54

Status: `ALPHA54_MOBILE_REEL_PICKER_INPUT_UX_COMPLETE`.

Alpha.54 uses the alpha.53 architecture boundaries to complete the production mobile Reel Picker and related list/input polish:

- total quantity uses an integer reel; material quantity fields use quantity plus step reels; unit uses a dedicated stable-order reel;
- icon-only X/Check owns the complete edit session with explicit save, one-request maximum, duplicate-submit guard, and clean teardown;
- canonical full-draft normalization, optional-field validation safety, and an alias-free pure response normalizer prevent malformed-response and unhandled-promise regressions;
- immediate fixed-height search now supports Korean initial consonants and a search-specific empty state;
- one workflow policy owns filter groups, predicates, card badge labels, and variants;
- compact due-date layout/date-cell alignment and existing alpha.52-alpha.53 behavior remain accepted on physical iPhone;
- approved automated and owner-attributed dev/test saves ended at WorkOrder/revision/material `42/42/20`, event/receipt `75/26`; final UI/search QA added mutation `0`;
- schema/migration, R2/PDF/token, production, dependency, native, and EAS effects remain zero.

Evidence: `53-mobile-reel-picker-input-ux-evidence.md`.

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

## Next candidate — 2.0.0-alpha.55

Candidate objective: material order request/cancel/complete lifecycle only after owner approval.

Potential included scope, subject to the actual alpha.55 Delta:

- exact material request/cancel/complete transitions and field locking;
- permissions, expectedVersion, idempotency, receipts/events, and canonical read-model reflection;
- reuse of the existing material feature/controller/policy and explicit mutation gate;
- bounded dev/test effect plan plus physical-device behavior QA.

Explicitly separate later scope:

- hard DELETE and purge remain forbidden;
- production deployment or mutation, schema changes, and unrelated feature expansion remain excluded;
- native dependencies/plugins and EAS Build/Update require an explicit boundary.

Alpha.55 does not start merely because it is listed here. It begins only with its owner-approved self-executing Version Delta and a matching clean baseline. After documentation-only canonical maintenance, that baseline is the latest synchronized maintenance commit HEAD, while the alpha.54 product artifact remains the snapshot of its original release HEAD.
