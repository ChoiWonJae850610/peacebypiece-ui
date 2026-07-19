# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.49

Status: `ALPHA49_CANONICAL_CODEX_INSTRUCTION_ARCHITECTURE_COMPLETE`.

Alpha.49 is documentation and development-infrastructure only:

- establishes Permanent Rules / Current Baseline / Version Delta / Immutable Evidence;
- assigns one canonical owner per recurring rule or fact;
- replaces mandatory full-history reading with a stable core set plus conservative task routing;
- compacts current-state and roadmap history into current snapshots and evidence links;
- separates device QA, environment setup, Runtime runbook, API semantics, and verification semantics;
- defines exact Version Delta fields and standing authorization without weakening production, native/EAS, destructive, tenant, or security gates;
- adds document architecture contracts and current-version compatibility assertions;
- changes no mobile UI, API behavior, DB/schema, Runtime behavior, historical evidence, native input, or EAS state.

Evidence: `48-canonical-codex-instruction-architecture-evidence.md`.

## Latest completed feature result — 2.0.0-alpha.48

Status: `ALPHA48_MOBILE_MATERIALS_REAL_READ_COMPLETE`.

The live ProductionCard fabric tab uses actual tenant-scoped material Read data with bounded lazy/cache/request identity behavior and accepted physical-iPhone presentation. Business/DB/R2/PDF/token/native/EAS effects were zero. Full facts remain in `47-mobile-materials-real-read-evidence.md`.

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

Older results remain in the numbered evidence files indexed and task-routed by `00-start-here.md`. Their detailed outcomes are not duplicated here.

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

## Next candidate — 2.0.0-alpha.50

Candidate objective: draft material basic editing.

Potential included scope, subject to the actual alpha.50 Delta:

- add/edit/delete draft material lines;
- explicit save;
- expected/entity version and conflict handling;
- dirty-state/input-loss guard;
- actual API and tenant/permission audit before mutation.

Explicitly separate later scope:

- material order request/cancel/complete Commands;
- accessory tab implementation;
- production deployment or production mutation;
- native dependencies/plugins and EAS Build/Update;
- unrelated UI polish or document lifecycle work.

Alpha.50 does not start merely because it is listed here. It begins only with its owner-approved Version Delta and a matching clean baseline.
