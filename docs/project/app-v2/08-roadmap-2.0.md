# WAFL v2 App-first Roadmap and Version Delta

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.57

Status: `ALPHA57_MOBILE_OVERVIEW_CATEGORY_INLINE_INPUT_COMPLETE`.

Alpha.57 completes the Maker mobile WorkOrder image, overview, Category, and inline-input boundary on the accepted alpha.56 lifecycle baseline:

- real WorkOrder images and attachments reuse the existing model and controlled Worker/proxy transport for read, upload completion, camera/file acquisition, preview, representative selection, and delete lifecycle;
- AI image generation and Factory image features remain excluded, and tenant, permission, storage-key, expected-version, and object-lifecycle guards remain authoritative;
- the common detail header is simplified, tabs precede overview content, and the overview presents total quantity, due date, Category, and amount summaries;
- 대상 and 대분류 use the shared option Reel Picker; 세부 품목, 시즌, factory-delivery memo, and fabric/accessory usage-location and memo fields use bounded button-free inline save;
- zero-first numeric editing and leading-zero normalization are shared while canonical order calculation and formatting remain unchanged;
- normal Maker presentation removes archive recovery UI while preserving internal soft-delete/history and the established fabric/accessory lifecycle; default units are fabric `yd` and accessory `개`;
- automated verification and Runtime evidence plus later owner physical-iPhone smoke confirmation cover the accepted scope, without converting the earlier `NOT_RUN` V10 checklist into individual formal PASS claims;
- schema/migration and production mutation remain zero. Finalization added no Runtime, DB, R2, dependency, native, or EAS effect.

Evidence: `57-mobile-overview-category-inline-input-evidence.md`.

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

## Next candidate — 2.0.0-alpha.58

Candidate objective: Maker mobile size/color read-only foundation only after owner approval.

Potential included scope, subject to the actual alpha.58 Delta:

- reuse the existing `/size-color`, `/size-spec`, and v2 read model before introducing a new model;
- present loading, error, empty, and read states for sizes, colors, the quantity matrix, and finished measurements;
- keep the candidate Maker-only.

Explicitly separate later scope:

- create, update, delete, quantity or measurement mutation, template save, and automatic total-quantity changes remain excluded;
- schema/migration, Factory, production deployment/mutation, dependency/native/EAS, and unrelated feature expansion remain excluded.

Alpha.58 does not start merely because it is listed here. It begins only with its owner-approved self-executing Version Delta and the final synchronized alpha.57 HEAD.
