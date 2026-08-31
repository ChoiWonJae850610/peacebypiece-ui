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

## Alpha.68 final device result

Owner physical iPhone QA is explicitly accepted as PASS through the final close-animation ownership
correction. A first backdrop touch and parent/nested close complete one uninterrupted exit after keyboard
dismissal; New Recipe handoff removes the old sheet before detail opens; nested Size/Color/POM close leaves
no trapped sheet or keyboard. The accepted boundary also covers footerless direct input, duplicate body
`추가` removal, replace-sheet processing, internal-tap persistence, keypad-only minimal accessory,
single-Y geometry, drag dismiss/snap-back, and submit-before-blur. This final Owner evidence advances the
product checkpoint to `ALPHA68_COMPLETE` and finalization checkpoint to
`ALPHA68_FINALIZATION_COMPLETE`; it does not retroactively rewrite earlier pre-finalization evidence.

## Alpha.69 focused recommendation and replacement QA

Checkpoint `ALPHA69_WAFL_INPUT_INTERACTION_ARCHITECTURE_IPHONE_REQA_REQUIRED` requires physical iPhone review of
changed seed/Decision/blocker surfaces only. Verify exact editable starter values across seven target-major templates,
male-bottom 28–36/FREE primary guidance with 24/26 disclosed, target/major reset Decision cancellation and change,
zero-loss one-V replacement, same-sheet WAFL INPUT reel decisions for real loss and target/major reset, and a recommended-spec load blocker that appears before loading begins. Automated evidence does
not infer this physical result.

## Alpha.69 final device result

Owner physical iPhone QA is explicitly accepted as PASS after the destructive-scroll and global-blocker lifecycle correction. The accepted boundary covers target × major Size guidance, seven exact Basic Fit Seed V0.1 starter templates, item-aware POM guidance, zero-loss replacement, same-sheet destructive decisions without nested same-axis scrolling, and terminal processing-blocker lifecycle. This advances the product checkpoint to `ALPHA69_COMPLETE` and finalization checkpoint to `ALPHA69_FINALIZATION_COMPLETE`; it does not rewrite earlier pre-finalization evidence.

## Alpha.70 final device result

Owner physical iPhone QA is explicitly accepted as PASS for the cumulative alpha.70 PDF and media workflow. The accepted boundary covers 58/42 cover balance, supplemental gallery readability, product-name autosave coordination, Photos/Camera and HEIC/HEIF image acquisition, revision-level image document inclusion, Image/Document authoring separation, PDF-only new attachments, authenticated Draft PDF Viewer derivative rendering, and authoritative attachment delivery-selection reconciliation. This advances the product checkpoint to `ALPHA70_COMPLETE` and finalization checkpoint to `ALPHA70_FINALIZATION_COMPLETE`; finalization itself changes no product behavior.

## Alpha.71 final device result

Owner physical iPhone QA is explicitly accepted as PASS on the internal Development Build containing SDK55 `expo-screen-orientation`. Recipe remained portrait-up when the handset rotated after entry and when Recipe was entered while the handset was already landscape. The bounded sanity checks also accepted Photos/Camera persistence, PDF attachment open and delivery-selection persistence, and the unchanged `스케치(준비 중)` affordance. Tablet physical QA was not required; source, type, and global-config evidence preserve tablet `default` portrait/landscape rotation. This advances the product checkpoint to `ALPHA71_PRE_DRAWING_COMPLETE` and finalization checkpoint to `ALPHA71_FINALIZATION_COMPLETE` without inferring unrun tablet hardware evidence.

## Alpha.72 renderer comparison QA

The Owner reports the alpha.72A native iPhone portrait stabilization check as PASS (`고정된다`). Checkpoint
`ALPHA72_DRAWING_RENDERER_POC_ENTRY_GATE_IPHONE_REQA_REQUIRED` requires the existing Skia-capable Development Build and a
bounded physical iPhone comparison of SVG versus Skia using the same Scene: slow/fast freehand, renderer toggles without
jump/stretch/reset, Sparse/Medium/Heavy smoothness judgment, portrait-lock regression, and normal Recipe/Image behavior.
The enabled comparison entry is available to an ordinary authenticated Recipe only in a development bundle; System Admin
and `[SIM]` identity are not required, while release/production retains disabled `스케치(준비 중)`.
Automated source/build evidence does not infer renderer physical PASS or select a winner. Android physical comparison
may remain `NOT_RUN`.

The comparison binaries are internal Development Builds `71a3b621-31e9-493d-ac04-2888f0337abf` for iOS and
`a2416e06-2ca0-431a-b575-67dafc29e871` for Android. Build completion and installability are verified; the Owner must
still perform the SVG/Skia physical comparison before any renderer recommendation.

## Alpha.72 SVG selection and authoring performance QA

The Owner completed the bounded renderer comparison and selected SVG: overall difference was small, SVG felt marginally faster
at Medium, and Skia showed no clear Heavy advantage. The current checkpoint
`ALPHA72_SVG_RENDERER_AUTHORING_PIPELINE_OPTIMIZATION_IPHONE_QA_REQUIRED` uses an authenticated DEV SVG-only performance lab.
Automated contracts prove transient world-coordinate authoring, pointer-move Scene/history mutation `0/0`, release commit `1/1`,
endpoint-preserving `1.5` world-unit sampling, workload identity, Skia source/package residual zero, and production Sketch
isolation. Owner iPhone QA still judges Sparse/Medium/Heavy response, curve fidelity, whole-stroke Undo/Redo, counters, portrait
zero-twitch, and normal Recipe/Image regression. Those physical results are not inferred.

## Alpha.72 freehand fidelity and Heavy render optimization QA

Checkpoint `ALPHA72_FREEHAND_FIDELITY_HEAVY_RENDER_OPTIMIZATION_IPHONE_QA_REQUIRED` keeps the authenticated DEV SVG lab and
the existing installed Development Build because the change is JavaScript/TypeScript-only. Owner iPhone QA must judge slow
curves, fast curves, short strokes, Heavy drawing response, whole-stroke Undo/Redo, displayed sample/gap/render counters,
portrait zero-twitch, and normal Recipe/Image regression. Automated contracts prove raw-point preservation, shared
active/committed smoothing, zero interpolation, pointer-move committed rebuild `0`, and release Scene/history commit `1/1`;
they do not infer physical curve quality or frame responsiveness. Android physical QA may remain `NOT_RUN`.

## Alpha.72 final device result

Owner physical iPhone QA is explicitly accepted as PASS for natural slow/fast/short freehand curves, bounded Heavy
response, active-stroke committed layer/projection/path counters remaining `0/0/0`, and portrait zero-twitch. The Owner
also selected SVG over the bounded Skia candidate. This advances the product checkpoint to
`ALPHA72_DRAWING_FOUNDATION_COMPLETE` and finalization checkpoint to `ALPHA72_FINALIZATION_COMPLETE`. Production still
shows disabled `스케치(준비 중)`; DEV renderer/performance labels do not become product naming, and alpha.73 editor work
is not started. Finalization itself adds no physical behavior delta and requires no additional device pass.

## Historical results

Do not copy version-by-version results into this plan. Use immutable evidence:

- external mobile foundation and iOS build: `40-external-mobile-qa-foundation-evidence.md`, `42-ios-development-build-evidence.md`;
- real-data mobile slice: `43-mobile-real-data-read-only-evidence.md`;
- ProductionCard overview: `44-mobile-production-card-core-overview-evidence.md`;
- basic-info update: `45-mobile-basic-info-update-evidence.md`;
- developer auto-connect: `46-mobile-tailscale-serve-developer-auto-connect-evidence.md`;
- material Read: `47-mobile-materials-real-read-evidence.md`.
- material draft create/update: `49-mobile-material-draft-create-update-evidence.md`.
