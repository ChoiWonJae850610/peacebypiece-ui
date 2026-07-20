# WAFL v2 App Device Test Plan

Document role: canonical owner for supported-device matrix, physical-device acceptance, and UI/product QA classification. Permanent execution rules belong to `09-codex-working-rules.md`; external start/stop commands belong to `41-external-mobile-qa-runbook.md`; historical device results belong to numbered evidence.

## Completion model

- Static layout/type/build evidence is not physical-device evidence.
- Simulator, browser, manifest, and bundle reachability do not prove actual-device interaction.
- A user-visible feature reaches completion only at the level required by `docs/project/32-product-completion-and-ui-evidence-standard.md` and the active Version Delta.
- Actual devices not exercised are `NOT_RUN`, never inferred PASS.
- User-reported acceptance covers only the instructed checks actually performed.
- Documentation/infrastructure-only versions such as alpha.49 require no device QA unless their Delta explicitly adds one.

## Supported device matrix

| Device | Primary orientation | Required concerns | Current actual evidence |
| --- | --- | --- | --- |
| iPhone | portrait | one-card flow, Korean input, touch targets, loading/error, background/re-entry, share/camera when implemented | alpha.43–50 evidence |
| iPad mini | portrait and landscape | readable centered workspace, drawer/selection, tab and table overflow | actual feature QA remains task-specific |
| iPad Pro | portrait and landscape | useful expanded/split review without desktop-admin compression | actual feature QA remains task-specific |
| Galaxy phone | portrait | Android permissions/input/navigation and production-card density | actual feature QA remains task-specific |
| Galaxy Tab | portrait and landscape | Android file/camera permission, Korean input, rotation recovery | actual feature QA remains task-specific |

Normal phone production-card work is portrait-first. A future drawing/sketch module may define a separately approved phone-landscape exception. Tablet layouts must support both orientations in code before actual-device acceptance can be requested.

## Shared acceptance requirements

For every applicable device and feature, verify:

- exact target screen, section order, and customer wording;
- canonical WAFL visual/interaction grammar;
- touch target, keyboard/Korean input, numeric/date behavior;
- no unintended horizontal overflow, content clipping, or fixed-control overlap;
- loading, empty, permission, not-found, network, server, schema, retry, and session states as applicable;
- back navigation, unsaved-input guard, background/re-entry, and orientation recovery;
- no crash, red screen, blank screen, or infinite loading;
- no raw internal identifiers, storage identity, token, host, or technical error exposure;
- request/effect counts or bounded ledger when the Delta requires them;
- actual business/DB/R2/PDF/token/native/EAS effects against the approved budget.

Camera, file picker, attachment, share sheet, and native permissions are tested only after those behaviors exist in the active Delta.

## UI judgment gate

When visual design, responsive layout, generated document, or information architecture changes:

1. automated checks establish source/static correctness;
2. the exact running target is inspected on required viewports/devices;
3. functional and visual conformity are reported separately;
4. the owner supplies the required final judgment;
5. commit/Finish waits until that judgment passes.

Do not use a previous version's design acceptance as proof that a newly changed screen conforms.

## External iPhone procedure template

The active Delta should tailor this minimal sequence:

1. confirm the canonical read-only or approved bounded runner is ready;
2. connect iPhone Tailscale and use cellular when external-path evidence is required;
3. open the installed WAFL Development Build;
4. use at most the specifically approved Reload count;
5. verify normal developer auto-connect without exposing a code when that mode is in scope;
6. exercise exact list/detail/tab/action/error steps named by the Delta;
7. verify background/re-entry and disconnect/reconnect rules when relevant;
8. report PASS/FAIL and anomalies without sharing credentials, codes, identities, cookies, tokens, or UUIDs.

The canonical operational steps and teardown remain in `41-external-mobile-qa-runbook.md`.

## Current installed-build boundary

- Official QA uses the installed EAS Development Build, not Expo Go.
- Current iOS Development Build number is `1`.
- Reuse is allowed while native dependencies, plugins, ATS, manifests, bundle identity, and native/runtime compatibility remain unchanged.
- JavaScript/TypeScript-only versions do not imply EAS Build or EAS Update.
- Any newly required native change stops the current non-native Delta and requires separate approval.

Environment identity and native configuration are owned by `06-expo-environment-setup.md`.

## Historical results

Do not copy version-by-version results into this plan. Use immutable evidence:

- external mobile foundation and iOS build: `40-external-mobile-qa-foundation-evidence.md`, `42-ios-development-build-evidence.md`;
- real-data mobile slice: `43-mobile-real-data-read-only-evidence.md`;
- ProductionCard overview: `44-mobile-production-card-core-overview-evidence.md`;
- basic-info update: `45-mobile-basic-info-update-evidence.md`;
- developer auto-connect: `46-mobile-tailscale-serve-developer-auto-connect-evidence.md`;
- material Read: `47-mobile-materials-real-read-evidence.md`.
- material draft create/update: `49-mobile-material-draft-create-update-evidence.md`.
