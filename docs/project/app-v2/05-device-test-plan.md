# WAFL v2 App Device Test Plan

## Alpha.75 final device result

- Owner actual iPhone QA: `PASS` for the complete alpha.75 overlay palette, Selection/Delete, stroke-partial Eraser,
  visual feedback, Undo/Redo, portrait continuity, and Save/close/reopen. Alpha.75 Save count is at most one.
- Owner actual iPad-mini QA: `PASS` for the same bounded tool and persistence path. Alpha.75 Save count is at most one,
  and orientation regression is `0`.
- Regular/Large iPad actual-device QA: `NOT_RUN`; supported orientation and Drawing behavior remain contract evidence.
- Android phone/tablet actual-device QA: `NOT_RUN`; physical PASS is not inferred.
- Finalization adds no Save or device mutation. This advances `ALPHA75_COMPLETE` and
  `ALPHA75_FINALIZATION_COMPLETE`.

## Alpha.75 Overlay Palette + Stroke Partial Eraser gate

- Checkpoint: `ALPHA75_OVERLAY_PALETTE_STROKE_ERASER_IPHONE_IPAD_QA_REQUIRED`; physical PASS is not inferred.
- On iPhone portrait and iPad-mini portrait, open the current drawing-tool selector. Verify one vertical icon-only
  overlay presents pen/line/arrow/rectangle/ellipse/text without moving or shrinking the canvas. Select each tool and
  verify the overlay closes/current icon changes. Tap canvas outside it and verify the menu closes while Scene/history
  remain unchanged and no stroke begins.
- Create freehand, line, arrow, unfilled rectangle, unfilled ellipse, and text. With Eraser, verify its thin ring is
  comfortably larger than the former tiny cursor and matches the touched removal area. Partially cross every supported
  stroked vector; only touched portions disappear in preview/release, text stays unchanged, and untouched semantic
  elements preserve their original rendering.
- Verify shaft and both arrowhead sides, all rectangle sides, and several ellipse arcs. One drag may cross multiple
  kinds but must Undo in one step to exact original kinds/ids/order/geometry, then Redo to the exact flattened Scene.
  Cancel/tool switch clears ring/preview without mutation. Each device may Save at most once after all local checks,
  then close/reopen to verify the flattened Scene. Regular/Large iPad and Android remain `NOT_RUN`.

## Alpha.75 Partial Eraser + Compact Sketch Toolbar gate

- Checkpoint: `ALPHA75_PARTIAL_ERASER_COMPACT_TOOLBAR_IPHONE_IPAD_QA_REQUIRED`; physical PASS is not inferred.
- On iPhone portrait and iPad-mini portrait, verify the seven icon-only top controls fit without clipping, the current
  drawing-tool icon opens a compact menu containing `펜 / 선 / 화살표 / 사각형 / 타원 / 텍스트`, selection and eraser
  remain independent, and choosing a menu item closes it and updates the current icon.
- Verify `선택 객체 삭제` is disabled without selection and deletes only the selected object; verify `전체 지우기`
  has a different icon, is disabled for an empty Scene, and clears the entire Scene. Undo/Redo must restore both paths.
- Draw a long Pen stroke and erase its middle, start, and end. The exact-radius ring and would-be-erased segment preview
  must follow the finger; release must leave deterministic visible fragments with no gap between sparse samples. Cross
  line/arrow/rectangle/ellipse/text and verify no highlight, partial change, or deletion.
- Verify one partial-erase drag over multiple Pen strokes is undone by one Undo and restored by one Redo. Cancel/tool
  switch clears ring/preview without Scene change. Each device may use at most one alpha.75 Save, only after local
  authoring/history checks, followed by close/reopen Scene verification. Regular/Large iPad and Android remain
  `NOT_RUN`; automated evidence does not infer their physical PASS.

## Alpha.75 Eraser Visual Feedback re-QA gate

- Checkpoint: `ALPHA75_ERASER_VISUAL_FEEDBACK_IPHONE_IPAD_REQA_REQUIRED`; physical PASS is not inferred.
- On iPhone and iPad mini, choose `지우개`, touch empty canvas, and verify the thin circular ring appears immediately
  and follows the finger. Cross each of freehand/line/arrow/rectangle/ellipse/text and verify each candidate outline
  stays visible for the remainder of that one gesture.
- Release, cancel/terminate where physically available, and switch tools; cursor and every candidate highlight must
  disappear with no residual. Repeat a multi-object drag and Undo once to retain the already accepted whole-object set,
  one-history-entry, and original-order restoration semantics.
- This re-QA is visual/tactile only. Do not perform an additional Drawing Save; persistence/reopen was accepted in the
  prior alpha.75 physical gate.

## Alpha.75 Selection / Hit-Test / Object Delete / Eraser gate

- Checkpoint: `ALPHA75_SELECTION_HITTEST_OBJECT_ERASER_IPHONE_IPAD_QA_REQUIRED`; automated evidence must not be
  reported as Owner physical PASS.
- Retained DEV QA Recipe: `QA A73 product sketch retained` (`fb1f3f75fd06`); do not delete or reset it.
- iPhone and iPad mini each have at most one authorized alpha.75 Save. Confirm the eight-tool toolbar, selection outline,
  empty-tap clear, topmost overlap, border-only unfilled rectangle/ellipse selection, exact selected Delete, multi-object
  whole eraser, one-step Undo/Redo, explicit Save/reopen with no restored selection, portrait continuity, and retained
  pen/line/arrow/rectangle/ellipse/text behavior.
- Regular/Large iPad and Android physical results remain `NOT_RUN`; source/contract regressions preserve their existing
  orientation policy without inferring physical PASS.

## Alpha.74 final device result

- Owner actual iPhone QA: `PASS` for general WAFL portrait-only, Product Sketch portrait/open continuity, and alpha.74
  Drawing regression. Its prior Save count is one; finalization adds no Save.
- Owner actual iPad-mini QA: `PASS` for general/Sketch portrait-only, content and native outer-frame/black-diamond motion
  `0`, bounce `0`, split-layout flash `0`, Recipe/tab/Sketch continuity, pen/line/arrow/rectangle/ellipse, touch/render
  alignment, mixed Undo/Redo, and exactly one Save followed by close/reopen of the editable WORLD Scene.
- Regular/Large iPad actual-device QA: `NOT_RUN`. Its general portrait+landscape and Sketch portrait-only policy remains
  automated contract evidence and a later production gate.
- Android phone/tablet actual-device QA: `NOT_RUN`. It is not inferred PASS and is not an alpha.74 finalization blocker.
- Address Search provider-result physical path remains `NOT_RUN`. No additional Owner device action is required for
  alpha.74 finalization.
- This advances `ALPHA74_COMPLETE` and `ALPHA74_FINALIZATION_COMPLETE`.

## Alpha.74 iOS Compact Native app/window mask gate

- Install only fresh existing-project iOS `development` build `90ec13f2-b6ec-4e2e-baba-c1195161a69c`, which contains
  the generated AppDelegate compact mask.
- On iPad mini, cold-launch first in portrait and then while physically held landscape. Both WAFL content and the outer
  native window must remain portrait with black edge/diamond/frame rotation attempt and bounce `0`.
- In retained Recipe detail, repeated left/right rotation must preserve selected Recipe/tab/detail and keep split-layout
  flash, Decision, automatic Save, content motion, and native-frame motion at `0`.
- In Product Sketch, rotate both directions without touching the canvas. The Sketch stays open and portrait with native
  frame motion, underlying Recipe replacement, Decision, and automatic Save `0`.
- Only after every no-motion gate passes may Owner perform the single remaining iPad Drawing Save/Reopen. Additional
  iPhone Save is `0`. Regular/Large iPad base landscape remains contract evidence until such a device is available.
- Automated evidence never infers Owner physical zero-motion PASS.

## Alpha.74 Compact Tablet zero-rotation-motion re-QA gate

- Reuse the currently installed fullscreen-enabled iOS Development Build; a new EAS Build/re-sign/reinstall is not part
  of this checkpoint.
- Cold-launch iPad mini in portrait and while physically held landscape. General WAFL must remain visually portrait with
  rotation animation/bounce `0`, temporary landscape/split presentation `0`, and navigation reset `0`.
- Repeat physical left/right rotation in retained Recipe detail. Selected Recipe/tab and the stable detail subtree must
  remain continuous, with split-layout flash `0` and Save `0`.
- Open Product Sketch without touching the canvas and rotate both directions. Portrait presentation, open continuity,
  Scene visibility, Decision `0`, and automatic Save `0` are required before any Drawing Save QA.
- Only after those gates PASS, run the retained mixed-tool regression and exactly one iPad Save/reopen. Regular/Large
  Tablet rotation remains contract/simulation evidence in this checkpoint. Physical PASS is not inferred.

## Alpha.74 iOS fullscreen native-build gate

- Install only existing-project internal iOS `development` build `035dd0f3-8be1-4c24-8cd0-6759788bebef`; an older IPA,
  re-sign, EAS Update,
  preview/production build, TestFlight, or App Store delivery is not evidence for this gate.
- On iPhone, verify base WAFL and Product Sketch remain portrait-only without performing an additional Drawing Save.
- On iPad mini, cold-launch general WAFL while held landscape and verify it presents portrait; then verify selected Recipe,
  active tab, and responsive detail continuity. Open Product Sketch and verify it remains portrait-only with no automatic
  close, Decision, or Save. Perform the single permitted iPad Save/Reopen only after those no-save orientation gates pass.
- Regular/large iPad base portrait+landscape remains a contract/simulation gate because no such physical device is
  available. `UIRequiresFullScreen` intentionally disables iPad Split View and Slide Over. Automated evidence never
  infers Owner physical PASS.

## Alpha.74 compact-tablet and Product Sketch portrait-policy gate

- iPhone general WAFL and Product Sketch must remain portrait-only; no additional iPhone Save is permitted.
- iPad mini is the compact-tablet physical reference, not a runtime model-name branch. General WAFL and Product Sketch
  must remain/return portrait while selected Recipe, current tab, Sketch session, and Scene remain continuous.
- Product Sketch must remain open during physical rotation and cause no Decision or automatic Save. One iPad Save/Reopen
  is allowed only after orientation and no-save Drawing smoke gates pass.
- Regular/large tablet base WAFL portrait+landscape and post-Sketch restore are contract/runtime-simulation gates because
  no such physical device is currently available. Large-tablet physical PASS is not inferred.

## Alpha.74 iPad responsive detail-continuity re-QA gate

- The first Sketch supported-orientation correction remains installed, but Owner iPad mini physical QA still closed
  Sketch in both directions. The current correction preserves one selected Recipe detail/gallery/Sketch subtree identity
  while the responsive list/detail layout changes.
- First perform the no-gesture portrait→landscape and landscape→portrait gate in one open Sketch session. Sketch, selected
  Recipe, current tab, unsaved Scene, and existing Scene must remain; close/Decision/automatic Save count is zero.
- Only after both directions pass, close Sketch without saving, rotate the active Recipe once, verify Recipe/tab continuity,
  reopen Sketch, then resume geometry, repeat-rotation, stale-gesture cancellation, and exactly-one iPad Save/Reopen QA.
- iPhone remains a no-save portrait/open-close smoke because its alpha.74 Save budget is already consumed. Automated
  stable-identity and orientation contracts do not infer Owner physical PASS.

## Alpha.74 iPad Sketch orientation-lifecycle re-QA gate

- Owner iPhone portrait QA is PASS; its one permitted Save is consumed. Re-QA is a no-save open/close smoke only.
- Owner iPad mini physical rotation closed Product Sketch in both portrait→landscape and landscape→portrait before any
  active gesture or iPad Save. After the Product Sketch-local Modal orientation correction, first verify both rotations
  keep Sketch open with no Decision, navigation, or automatic Save.
- Only after that lifecycle gate passes, resume the blocked iPad WORLD geometry, repeated-rotation/no-drift,
  active-gesture cancellation, and exactly-one Save/Reopen checks. iPad Save budget remains one.
- Automated source/runtime evidence does not infer the iPad physical result.

## Alpha.74 responsive shape-authoring iPhone/iPad gate

- On iPhone portrait, verify the six-tool toolbar without clipping, draw rectangle/ellipse in opposite drag directions,
  confirm transient preview and exact Undo/Redo order, save once, close, and reopen with unchanged geometry.
- On iPad portrait and landscape, inspect the same saved Scene before drawing. Rotation alone must not stretch, move, or
  rewrite any element. Draw ellipse/line in landscape, rotate repeatedly, and confirm unchanged world geometry.
- Rotate during an active rectangle gesture. The stale gesture must cancel without a malformed element/history commit;
  after layout settles, a new rectangle must author normally. Save at most once on iPad and reopen in the opposite
  orientation with the same element IDs/order/geometry.
- Pen/line/arrow/text, text child-sheet lifecycle, explicit Save/reopen, dirty discard, and phone portrait policy remain
  regression gates. Automated evidence does not infer Owner iPhone or iPad PASS.

## Alpha.73 final device result

Owner actual-iPhone QA is accepted as PASS for the cumulative A73D Keyboard / Static Sheet stabilization gate. The final
statement `다 잘된다. 이제 키보드는 다 되는거같다` supersedes the earlier intermediate failures for New Recipe,
Spec Save, Direct Size/Spec/POM, repeated show/hide/refocus, registered TEXT↔PHONE_NUMBER handoff, Start/Destination
detail/contact, Quick driver name/contact/memo, nested address keyboard ownership, Required Quantity/Loss-Allowance,
direct input↔Reel, numeric X/V/height/body-scroll, and Quick phone accessory/return-key behavior. No exact cycle count is
inferred. Earlier actual-iPhone evidence separately accepts Product Sketch pen/line/arrow/text, mixed Undo/Redo,
Save/reopen, and dirty discard without black screen. Address Search provider-result execution remains `NOT_RUN`; its
alpha.73 generation/crash/Search guards are automated regression evidence only. This advances the product checkpoint to
`ALPHA73_COMPLETE` and finalization checkpoint to `ALPHA73_FINALIZATION_COMPLETE` without inferring tablet, Android, or
unrun provider evidence.

## Alpha.73D registered handoff / Quick / numeric Reel iPhone re-QA

- In Quick direct address, alternate detail-address TEXT and contact PHONE_NUMBER ten times in each direction. The keyboard
  must not fully hide, root must not drop to static rest, and only the destination field may own the semantic reveal.
- In Quick driver information, repeat name → contact → memo → name ten times. Current field visibility, destination keyboard
  class, no stale target, no delayed second positioning, and no hide/show flicker are required.
- In required quantity and loss/allowance quantity keypad mode, edit `1`, `1.`, `1.0`, and `1.07`, delete/retype, and trigger
  legacy/validation/empty states. Root/body extent remains identical and `WAFL PICK으로 변경` stays fully visible.
- Switch keypad ↔ Reel ten times. Each actual mode change settles once; after settlement, numeric edits author root movement
  zero. Spot-check New Recipe, Spec Save, Direct Size/Spec, Direct Color, and Sketch Text. Automated PASS does not infer
  Owner physical PASS.

## Alpha.73D root-owner and Direct Create semantic-target re-QA

- On an actual iPhone, alternate New Recipe and Spec Save new-mode open/focus/hide/close for 20 cycles each, then
  alternate the two surfaces for five cross-surface chains. Each keyboard appearance may have one continuous root
  reveal only; delayed recovery, double rise, owner overlap, final-Y drift, and static-rest drift must all be zero.
- Repeat Direct Size create and Direct Spec/POM create for 20 cycles each. The field and its helper must remain above
  the keyboard with the shared gap, without pulling unrelated body content into the reveal. Direct Color must retain
  its existing palette interaction and must not inherit the new semantic scope.
- Verify keyboard hide returns to the exact current derived static rest and close/reopen starts a new owner generation.
  Automated evidence and contract PASS do not infer Owner physical PASS.

## Alpha.73D Spec Save motion-reference re-QA

- In `스펙 저장` new mode, verify `새 스펙 이름` appears before the new/update selector. Focus, hide, and
  refocus the name field: keyboard and Sheet use one continuous shared reveal, restore the same static rest,
  and accumulate no drift.
- Switch to update mode and verify its selector remains ahead of the long template/management content.
- Cold-launch New Recipe as a regression spot: its larger explicit semantic target remains intact while motion
  scheduling stays shared with Spec Save. Automated evidence does not infer Owner physical PASS.

## Alpha.73D compact semantic target formula re-QA

- Fully terminate and relaunch WAFL, open New Recipe, and tap product name once. Product, helper, work-
  character label, and the complete production/sample button row must remain above the keyboard with no
  second rise or delayed repair.
- Dismiss and refocus in the same session, then close/reopen and repeat. Cold and warm final geometry must
  match, static rest must restore exactly, and cumulative drift must remain zero.
- Spot-check Direct Size and Direct Spec/POM: their smaller semantic scopes must not expand merely because
  unrelated compact body content exists. Single-root, footer/action, nested, multiline, Quick, Reel, and
  fullscreen regression checks remain required. Automated evidence does not infer Owner physical PASS.

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
| iPad mini / compact tablet | portrait only | larger-phone continuity, readable workspace, tab and table overflow | alpha.74 policy requires actual compact-tablet QA |
| iPad Pro | portrait and landscape | useful expanded/split review without desktop-admin compression | actual feature QA remains task-specific |
| Galaxy phone | portrait | Android permissions/input/navigation and production-card density | actual feature QA remains task-specific |
| Galaxy Tab | class-dependent: compact portrait-only, regular/large both | Android file/camera permission, Korean input, stable short-side classification | actual feature QA remains task-specific |

Phone and compact-tablet production work is portrait-only. Regular/large tablet general WAFL supports both orientations. Product Sketch is portrait-only on every class; its Drawing model remains viewport-independent.

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

Alpha.73D semantic-scope replay re-QA uses the current installed Development Build. Fully terminate and relaunch WAFL,
open New Recipe, and immediately tap product name. Product name, helper, work-character label, and the complete production/
sample button row must all remain above the keyboard with one visible root reveal and no delayed correction. This exact
cold launch is repeated after another full termination; cold and warm final geometry must match. Dismiss restores exact
static rest with no auto-refocus. Direct Size, Direct Spec/POM, Quick contact, Address Direct TEXT↔PHONE_NUMBER, and Sketch
Text remain regression surfaces. DEV semantic subscription/replay and geometry evidence supports diagnosis but cannot
replace Owner physical judgment.

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

## Alpha.73B apparel annotation tools QA

Automated contracts prove the exact `펜 / 선 / 화살표 / 텍스트` product controls, WORLD-space line/arrow endpoints,
renderer-derived arrow direction, additive legacy-compatible text validation, bounded single-line Korean/English/number/
symbol round-trip, mixed four-step Undo/Redo, deterministic Save serialization, and child text-sheet ownership. Owner iPhone
QA remains required for touch-target/clipping, line straightness, visible arrow direction, text placement and keyboard close,
mixed Save/reopen fidelity, and dirty discard without black screen. Rectangle, ellipse, eraser, selection, PDF, and export
are not part of this device gate. Physical PASS is not inferred.

## Historical results

Do not copy version-by-version results into this plan. Use immutable evidence:

- external mobile foundation and iOS build: `40-external-mobile-qa-foundation-evidence.md`, `42-ios-development-build-evidence.md`;
- real-data mobile slice: `43-mobile-real-data-read-only-evidence.md`;
- ProductionCard overview: `44-mobile-production-card-core-overview-evidence.md`;
- basic-info update: `45-mobile-basic-info-update-evidence.md`;
- developer auto-connect: `46-mobile-tailscale-serve-developer-auto-connect-evidence.md`;
- material Read: `47-mobile-materials-real-read-evidence.md`.
- material draft create/update: `49-mobile-material-draft-create-update-evidence.md`.
## Alpha.73B-1 Product Sketch text input physical re-QA

- Repeat Text sessions at different canvas positions and verify the WAFL INPUT sheet is visibly presented before the
  keyboard every time; a keyboard-only state is a failure.
- Verify the WORLD-anchored insertion marker appears immediately and typed Korean/English/numeric/symbol content appears
  as ghost text at the same point. Confirmed text must not jump; canceled text leaves no marker, preview, or element.
- Repeat cancel/confirm sessions, mixed Undo/Redo, explicit Save/reopen, and dirty discard. The A73A2 black-screen and
  parent-close one-shot regressions remain required. Physical PASS is not inferred from automated projection contracts.

## Alpha.73B-2 shared WAFL INPUT transition and Sketch caret physical QA

- In Sketch Text, a normal Recipe single-line input, numeric/direct input, and a genuinely bottom-occluded field, verify
  sheet entrance plus keyboard/correction reads as one continuous transition. A distinct second sheet jump, overshoot,
  redundant final gap, keyboard-only sheet, or repeated-cycle offset drift is a failure.
- Already-visible fields must add no keyboard-show sheet movement. Occluded fields scroll the body first and expand only by
  the remaining minimum distance required for the full label/input/help semantic block. Keyboard hide restores the prior
  settled geometry unless a deliberate drag owns the new height.
- Sketch Text shows one small neutral vertical insertion caret, not the prior brick-orange crosshair. Typed ghost and final
  text share the exact WORLD anchor; cancel removes both transients, mixed Save/reopen remains stable, and dirty discard must
  not regress the A73A2 black-screen fix. Physical PASS is not inferred from automated contracts.

## Alpha.73B-3 shared keyboard visibility reconciliation physical re-QA

- In Sketch Text and New Recipe, verify the focused input itself—not only the WAFL INPUT header—is fully reachable above
  the final keyboard. Repeat five to ten times; keyboard-only, hidden-input, large second-jump, and offset-drift counts are zero.
- Verify numeric/direct input, a lower scrollable field, and a multiline/memo owner. Actual forward body scroll is consumed
  first; a minimum usable body floor or residual sheet rise supplies only the remaining visibility requirement.
- Keyboard hide restores the settled geometry with no delayed jump. Neutral vertical WORLD caret/ghost equality, mixed
  Save/reopen, A73A2 discard without black screen, pen/line/arrow, and portrait behavior remain regression gates.
- Automated floor/merged-target/didShow contracts do not infer physical PASS.

## Alpha.73B-4 coordinated direct-input entrance physical re-QA

- Sketch Text, New Recipe product name, and one direct Size/Color/POM create flow must present the mounted input and keyboard
  as one coordinated visible rise. The ordinary medium/resting sheet must not appear as an intermediate stage.
- Repeat each core path five to ten times. Focused input visibility remains complete, keyboard-only and hidden-input states
  are zero, visible sheet movement is one, large or micro third rises are absent, and open/hide offset drift is zero.
- A lower field still consumes actual forward body scroll before any meaningful residual sheet correction. Keyboard hide
  restores the ordinary resting geometry; manual drag ownership and no-keyboard ordinary-opening fallback remain usable.
- Neutral WORLD caret/ghost, mixed Save/reopen, A73A2 discard without black screen, pen/line/arrow, and portrait behavior remain
  regression gates. Automated coordinated-entrance contracts do not infer physical PASS.

## Alpha.73B-5 prepared local-geometry keyboard target physical re-QA

- Start with New Recipe, then Sketch Text and one other coordinated single-line input. The focused field and the intended
  compact content/action composition must reach their final keyboard-visible position in the first visible sheet movement;
  keyboard-leading, intermediate stop, second rise, hidden input, and repeated-cycle drift are failures.
- Repeat New Recipe and Sketch Text five to ten times. Normal core paths expect one synchronous keyboard-frame target and
  no visible did-show sheet correction. A meaningful did-show correction is recorded as a first-target miss.
- In a lower-field/long-form case, prepared forward body scroll is used first and only the residual visibility requirement
  may move the sheet. Keyboard hide restores ordinary geometry; drag, close, neutral caret/ghost, Save/reopen, dirty
  discard, pen/line/arrow, and portrait behavior remain regression gates. Automated contracts do not infer physical PASS.

## Alpha.73B-6 did-show micro reconciliation physical re-QA

- In New Recipe and Sketch Text, preserve the B5 coordinated main rise and repeat each flow five to ten times. After the
  first movement, final did-show sheet rise, hidden input, keyboard-only state, and offset drift must each remain zero.
- Confirm the focused semantic block and compact action composition are visible without an ornamental gap. A lower or long
  field must still use actual remaining body scroll first and allow residual sheet rise only for real clipping.
- Keyboard hide restores ordinary settled geometry without a delayed correction. Close/cancel/unmount cannot resurrect a
  stale sheet. Neutral WORLD caret/ghost, mixed Save/reopen, discard without black screen, pen/line/arrow, and portrait
  behavior remain regression gates. Automated classification contracts do not infer physical PASS.

## Alpha.73C Phase 4 compact reveal and keyboard-class transition physical re-QA

- New Recipe, Direct Size create, Direct Spec/POM create, and Sketch Text must reveal the measured semantic block with the
  minimum root movement. New Recipe still includes the full `본생산/샘플` row; Size/Spec helper text remains visible.
- Repeat each compact flow five to ten times. Over-rise, normal did-show second spring, stale session compensation, and
  cumulative root/body drift are failures. Close/reopen and a new Sketch text session must not inherit the prior generation.
- On Quick Contact first focus, the incoming phone keyboard frame and sheet target must coordinate once; Quick-local offsets
  are forbidden. In Address Direct, alternate detail TEXT and contact PHONE_NUMBER ten times. Old-frame reveal, incomplete
  rise, oscillation, and accumulated compensation must remain zero while X/V and numeric accessory stay available.
- Season/Detail, Direct Color, material multiline, Quick driver/memo, saved Spec, Overview state/taxonomy, Drawing, and Reel
  are regression-only. Address Search physical PASS is not inferred when the owner environment lacks the address API; its
  automated generation/crash/Search guards remain required.

## Alpha.73D Phase 1 static Sheet primitive core physical QA

- On New Recipe, Season/Detail direct input, Direct Size/Color/Spec, saved Spec, materials, and Quick surfaces, confirm the
  header cannot move the root and exposes no drag handle. Body scrolling, X/V or Done, backdrop/back cancel, processing,
  and nested return remain usable and exactly once.
- On target/major/detail/Season and other Reel surfaces, wheel movement and haptics remain local while the root stays fixed;
  X/V staging is unchanged.
- Smoke the full-view Size/Color/Spec table, due-date local cancel, Sketch fullscreen/dirty Decision, PDF/attachment viewer,
  image carousel, and list-row/body gestures as explicit exceptions.
- New Recipe, Direct Size, Direct Spec/POM, Sketch Text, Quick contact, and Address Direct keyboard-class issues remain
  acceptance targets. Static-core automation does not infer those previously failing surfaces solved.

## Alpha.73D Phase 2 static keyboard/input migration physical QA

- New Recipe must open Sheet-first without automatic keyboard, then reach one stable absolute reveal after field tap. A
  non-input tap dismisses the keyboard, keeps the Sheet open, and restores the same current static rest. Repeat ten cycles
  and three close/reopen sessions with root drift zero.
- Repeat the same manual-focus and ten-cycle drift check for Direct Size and Direct Spec/POM create; saved/edit Spec and
  Direct Color are regression-protected. X/V and canonical confirm remain exactly once.
- Quick contact must use the actual first PHONE_NUMBER frame. In Address Direct, alternate detail TEXT and contact
  PHONE_NUMBER ten times with no stale outgoing-frame reveal, oscillation, double rise, or accumulated root target.
- Sketch Text retains its WORLD caret/ghost/final anchor, zero-mutation preview, Save/reopen, and dirty-discard lifecycle
  while its child input Sheet shows no intermittent root drift. Fabric/Accessory multiline uses actual body capacity first,
  retains stable footer actions, and restores static root without stealing reasonable user body position.
- Reel wheel/haptics, due-date local cancel, Drawing/image/PDF/viewer/list-row gestures, footer/processing/nested close, and
  Overview state/taxonomy remain regression gates. Address Search remains NOT TESTED when its owner API is unavailable.
  Automated static-rest, ephemeral-target, class-transition, and generation contracts do not infer physical PASS.

### Alpha.73D Phase 2 New Recipe single-reveal blocker re-QA

- Open New Recipe and verify no keyboard appears before an explicit product-name tap.
- On tap, one fresh TEXT keyboard frame may author at most one visible system root reveal. A same-frame `didShow` may
  assert visibility and reconcile body scroll, but must not produce a second root rise.
- Dismiss and refocus ten times, then fully close/reopen and repeat: revealed and current-derived resting geometry must
  remain identical with zero cumulative drift.
- This narrow automated blocker contract does not infer New Recipe physical PASS or the broader Phase 2 surfaces PASS.

## Alpha.73D Phase 3 Static Sheet closure spot checks

- Compact Static Sheet: open `리오더 만들기` or an equivalent compact surface. The root must not drag; X/V/backdrop retain their existing meanings.
- Long Static Sheet: open `작업 이력`, `스펙 불러오기`, attachment selection, or full-view Size/Color/Spec. Only the body scrolls and the footer remains a stable sibling.
- Static Reel: open target/major/detail/Season or a material unit picker. The wheel/haptics move while root Y remains fixed; X/V remains staged and exactly once.
- Nested route: open a chooser child and return. Ordering remains outgoing close → `onAfterClose` → next presentation generation, with no duplicate or black frame.
- Due-date calendar: X/backdrop/back closes only the calendar child and preserves unrelated Overview staged fields.
- Fullscreen exception: smoke Product Sketch, image carousel, attachment viewer, or authenticated PDF viewer and preserve its local gesture owner.
- Keyboard regression: spot-check New Recipe. The Owner already reported Phase 2 PASS; Phase 3 must not reintroduce visible double rise or drift.
- Automated device matrix covers iPhone portrait, Android phone portrait, tablet portrait/landscape, and static layout recompute. Tablet/Android physical PASS remains `NOT TESTED` unless Owner reports it.

### Alpha.73D Phase 2 New Recipe keyboard-appearance single-reveal blocker re-QA

- The prior exact-frame checkpoint physically failed: one manual product-name focus still produced two visible rises when
  iOS emitted distinct intermediate/final keyboard frames inside one appearance.
- Open New Recipe and confirm Sheet-first presentation with keyboard auto-show `0`. Tap product name once. Across all native
  frames in that appearance, the root may perform at most one visually continuous reveal; intermediate stop, second rise,
  and delayed micro-rise are failures.
- Dismiss and explicitly refocus ten times, then fully close/reopen and repeat. Every appearance must have the same reveal,
  every hide must return to the current derived static rest, and root/body/session drift must remain zero.
- This blocker-first automated contract does not infer New Recipe physical PASS or any broader Phase 2 surface PASS.

### Alpha.73D cold-start first-focus geometry freshness re-QA

- Fully terminate WAFL, relaunch it, open New Recipe, and confirm the Sheet presents without automatic keyboard focus.
- On the first product-name tap, verify product name, helper, `작업 구분`, and the complete `본생산 / 샘플` row are above
  the keyboard. One root reveal is allowed; under-reveal, double-rise, and delayed second correction are failures.
- Dismiss the keyboard and verify exact derived static rest plus no automatic refocus. Tap again and compare the warm final
  geometry with the cold first-focus geometry; they must match while the warm fast response remains.
- Fully close/reopen New Recipe and repeat. Session-dependent geometry and cumulative drift are failures.
- Spot-check Direct Size, Direct Spec/POM, Sketch Text, Quick contact, and Address Direct keyboard-class transitions. This
  automated checkpoint remains `PHYSICAL_RESULT_NOT_INFERRED` until the Owner reports the cold-start device result.
