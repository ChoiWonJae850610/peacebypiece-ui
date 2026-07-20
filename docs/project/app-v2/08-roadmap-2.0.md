# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.50

Status: `ALPHA50_MOBILE_MATERIAL_DRAFT_CREATE_UPDATE_COMPLETE`.

Alpha.50 completes draft fabric-line create and update:

- one full supported-field create POST and explicit changed-field PATCH editing;
- validation, saving/error/conflict states, stale 409, dirty guard, and unsaved-new-editor cancellation;
- canonical detail/material refresh and WorkOrder-keyed cache synchronization;
- draft-only tenant/permission/runtime approval while saved DELETE and material order Commands remain blocked;
- retained QA data with actual version/material/event/receipt effects recorded transparently;
- physical-iPhone no-save guard/read-only QA and canonical runner teardown;
- schema, R2/PDF/token, production, native, and EAS effects remain zero.

Evidence: `49-mobile-material-draft-create-update-evidence.md`.

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

## Next candidate — 2.0.0-alpha.51

Candidate objective: define and implement the material-line soft-delete lifecycle only after owner approval.

Potential included scope, subject to the actual alpha.51 Delta:

- lifecycle policy and schema;
- visibility and restore behavior;
- revision snapshot and concurrency semantics;
- event/receipt effects and an exact bounded migration/mutation budget.

Explicitly separate later scope:

- hard DELETE remains forbidden unless the approved lifecycle explicitly changes that contract;
- material order request/cancel/complete Commands remain the alpha.52 candidate;
- accessory tab implementation;
- production deployment or production mutation;
- native dependencies/plugins and EAS Build/Update;
- unrelated UI polish or document lifecycle work.

Alpha.51 does not start merely because it is listed here. It begins only with its owner-approved Version Delta and a matching clean baseline.
