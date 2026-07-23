# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.53

Status: `ALPHA53_MOBILE_ARCHITECTURE_FOUNDATION_COMPLETE`.

Alpha.53 preserves alpha.52 product behavior while establishing the mobile architecture foundation:

- composition shell separated from list, overview, and material feature views;
- explicit session, navigation/lifecycle, query, and mutation execution boundaries;
- mobile-safe DTO/error contracts, business validation, editability policy, formatter, cache, and theme owners;
- known/unknown API error separation and dependency/import guards;
- behavior-centered controller, policy, formatter, validation, numeric/date, duplicate-submit, and request-count tests;
- mandatory measured PC-resource and remote-operation audits added to Permanent Rules;
- mutation-free Runtime and physical-iPhone regression acceptance with canonical teardown;
- migration, business data, R2/PDF/token, production, dependency, native, and EAS effects remain zero.

Evidence: `52-mobile-architecture-foundation-evidence.md`.

## Previous product result — 2.0.0-alpha.52

Status: `ALPHA52_MOBILE_CORE_INLINE_UX_CALCULATION_LIST_AND_DATE_COMPLETE`.

Connected mobile list/search/filter, same-position overview/material editing, numeric and currency formatting, calculated order quantity/amount, keyboard-safe narrow inputs, and compact due-date behavior remain complete. Detailed facts are preserved in `51-mobile-core-inline-ux-calculation-list-date-evidence.md`.

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

Older results remain in numbered evidence files indexed and task-routed by `00-start-here.md`. Their detailed outcomes are not duplicated here.

## Version Delta owner contract

Every new version begins with a short owner-approved Delta. It must contain:

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

The Delta does not repeat Permanent Rules. An omitted exceptional authority remains forbidden.

## Next candidate — 2.0.0-alpha.54

Candidate objective: mobile Reel Picker production implementation only after owner approval.

Potential included scope, subject to the actual alpha.54 Delta:

- number/unit/step value models using the alpha.53 formatter and feature/controller boundaries;
- bounded reel/snap/fade/accessibility behavior and a direct-input fallback;
- an exact approved field connection and physical-device visual/interaction QA;
- explicit dependency and native/EAS decision before any package or native change.

Explicitly separate later scope:

- material order request/cancel/complete remains a separately approved alpha.55 candidate;
- hard DELETE and purge remain forbidden;
- production deployment or mutation, schema changes, and unrelated feature expansion remain excluded;
- native dependencies/plugins and EAS Build/Update require an explicit boundary.

Alpha.54 does not start merely because it is listed here. It begins only with its owner-approved Version Delta and a matching clean baseline.
