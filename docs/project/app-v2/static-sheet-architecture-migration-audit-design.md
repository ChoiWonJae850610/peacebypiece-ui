# A73D Static Sheet Architecture Migration Audit and Canonical Design

Status: Live-root baseline, residual-scroll, and numeric return-key correction implemented; iPhone re-QA required at `ALPHA73D_LIVE_ROOT_BASELINE_RESIDUAL_SCROLL_AND_NUMERIC_RETURN_KEY_FIX_IPHONE_QA_REQUIRED`

Physical result: `PHYSICAL_RESULT_NOT_INFERRED`

Audit product behavior delta: `0`. Phase 1 retired common root drag. Phase 2 retires captured/session root baselines while preserving sizing, body, action, keyboard visibility, and lifecycle behavior.

This document is the alpha.73D migration authority. It replaces the **future direction** in the alpha.73C audit that retained a Sheet Drag Owner. Phase 1 supersedes the historical alpha.64–73 common-root drag assertions; Phase 2 supersedes captured pre-keyboard/root-baseline restore assertions with safety-equivalent Static Sheet keyboard contracts.

## Current root planning and numeric completion ownership

- Static rest remains the root bound and hide target. During a keyboard-visible registered handoff, planning begins at the
  current `systemKeyboard` motion/target authority; native-driver completion listeners are not the sole source of truth.
- Root-first planning allocates against that current root, then requests only the mathematically residual body scroll.
  Top clipping uses the actual body/header boundary, while semantic gap remains bottom keyboard clearance.
- A matching current keyboard target is a true root no-op even when an earlier native-driver completion value is stale.
- Numeric direct uses no WAFL accessory and no WAFL return-key completion; inline Sheet X/V remains the only WAFL action
  owner. Quick Search `search`, ordinary text Next/Done, and Quick phone policy are preserved.

## Live body-scroll authority and numeric mode-focus transaction

- Prepared geometry captures structure and a diagnostic offset, but root/body reveal is planned against the current live
  body offset. System reveal applies a signed delta to that value and records the applied delta in the focus cycle.
- Independent keyboard appearances begin from their own live baseline with zero inherited system/user delta. Only an exact
  registered-input handoff transfers an active cycle; unrelated blur/focus cannot inherit stale scroll authority.
- Root-first surfaces allocate legal root rise first and apply only the remaining body correction. Direct-input final
  reconciliation never creates a delayed animated body-scroll writer.
- Numeric Reel-to-keypad is one prepared mode-focus transaction. Static resting recomputation is suppressed until current
  direct-input targets and measurements are ready, then focus starts the normal single keyboard/root appearance.
- The numeric keypad's in-Sheet X/V row is the canonical action owner, so it opts out of iOS accessory rendering. The
  shared Quick Delivery phone-pad single-action accessory remains unchanged.

## Quick root-first reveal and numeric direct-input composition

- Quick Delivery's long-body fields select root-first allocation within the existing appearance transaction. The legal
  static-root range satisfies semantic reveal before body scroll; only the minimum residual content depth is applied as
  non-animated body scroll. The one visible root writer and current keyboard frame/generation guards are unchanged.
- Explicit semantic scopes cannot begin the appearance transaction while canonical body-content layout is null. Focus
  intent is replayed from the existing normalized-layout event; raw immediate-parent coordinates cannot author reveal.
- Numeric keypad mode uses shared direct-input prepared focus and root ownership. Its semantic region contains input,
  fixed opening-value/validation status, and the inline mode/shared-action row. The common lower footer is suppressed.
- The opening value is session identity, not a projection of edited text. The 40-point status region and 200-point direct
  extent are invariant across editing and validation. Reel mode remains behaviorally unchanged.

## Spec Save motion reference and conditional layout

- Owner-selected Spec Save is the physical timing reference for direct-input reveal, but it does not own a
  separate animation implementation. Spec Save and New Recipe share the canonical keyboard appearance/root
  scheduling and static hide-restore owners.
- New-save mode orders its name input before the mode selector. Update mode keeps the same selector before the
  long update list and management controls.
- Spec Save keeps minimal field reveal because mode selection is not the typed-name submit requirement. New Recipe
  independently retains its explicit semantic region. Shared scheduling and variable semantic target geometry are
  complementary Static Sheet invariants.

## Cold-start semantic-scope registration replay

- `WaflSheetSemanticFocusScope` stores its latest native layout independently from its listeners. A first layout that ran
  before the prior passive input subscription could therefore be retained by the scope but absent from the direct-input
  registry indefinitely.
- `WaflSheetTextInput` now installs the scope/focus-block listener with `useLayoutEffect`, then immediately replays
  `resolveLayout()`. Layout before subscription is replayed; layout after subscription is notified; the setup boundary has
  no missed-layout gap.
- Registering the same rectangle is a no-op. A newly replayed rectangle advances the existing registry and target-geometry
  revisions, recaptures prepared geometry, and makes any earlier snapshot stale.
- Fast-path freshness proves `registry semantic rect == current scope rect` and `prepared rect == registry rect`. A missing
  or stale semantic rect authors body/root `0/0` and consumes root claim `0`; the one appearance slot remains available for
  the first trustworthy full target or final measured fallback.
- New Recipe retains one semantic scope around product name, helper, work-character label, and the complete production/sample
  row. Warm/current geometry keeps the transition-synchronous fast path. Second visible root repair remains forbidden.
- Permanent additions are `SEMANTIC_SCOPE_INITIAL_LAYOUT_REPLAY`, `SUBSCRIBE_THEN_REPLAY_NO_GAP`,
  `COLD_START_REGISTRY_SEMANTIC_RECT_CURRENT`, `MISSED_INITIAL_LAYOUT_ROOT_CLAIM_ZERO`,
  `FIRST_FOCUS_FULL_CHARACTER_CHOICE_VISIBLE`, and `SINGLE_ROOT_REVEAL_PRESERVED`.

## Phase 3 migration closure

- LIVE recount remains `WaflInputSheet 26`, `WaflReelPickerSheet 8`, paired Reel `1`, `WaflDecisionSheet 3`, `InlineDatePicker 1`, and raw React Native `Modal 7` JSX/native hosts.
- The product-facing inventory is now source-owned in `waflLiveSheetInventory.ts` and contains 44 logical surfaces: `STATIC_BOTTOM_SHEET 7`, `STATIC_BOTTOM_SHEET_SCROLLABLE 17`, `STATIC_REEL_PICKER 9`, `CENTER_DIALOG_CANDIDATE 5`, `FULLSCREEN_KEEP 5`, and `SPECIAL_FIXED_MODAL_KEEP 1`.
- The 44 entries include recovery, filter, history, readiness, template, table/full-view, nested Quick/address, Decision, calendar, Drawing, PDF, attachment, and image owners that the earlier 25-entry representative list did not enumerate individually.
- Common root PanResponder, drag handle/zone, free-settle, user detent, drag-dismiss, user-authored root Y, and drag-only accessibility owners are all zero. Body scroll and Reel movement cannot author root Y. Drawing canvas, image carousel, list-row swipe, Reel wheel/haptics, ordinary body scroll, and fullscreen viewer gestures remain explicit non-root exceptions.
- Theme ratios now use static-extent names (`defaultStaticExtentRatio`, `maximumStaticExtentRatio`, and `fullViewStaticExtentRatio`) without changing their values. The `resolveWaflExpandableInitialHeight` input is `staticExtentRatio`; no live policy value is described as a detent.
- `WaflSheetSizing`, its five value names, and the filename/import route `waflSheetDetentPolicy.ts` remain compatibility API names for the 26-callsite migration boundary. They select static visible extent only and cannot enable root drag or user detents. Renaming the import authority is deferred because it would be a broad mechanical churn with no product or architecture gain.
- Due-date calendar remains a fixed special Modal; its child-local cancel terminates only the active due-date field session and does not restore or discard unrelated Overview staged state. Decision stays on its current shared non-nested compatibility surface; centered Dialog is classification only.
- Phone portrait and tablet portrait/landscape recompute static layout deterministically. Layout/safe-area changes do not mutate Recipe/input staged state. Physical tablet and Android PASS are not inferred.
- Owner-reported Phase 2 iPhone evidence is recorded as actual physical evidence: New Recipe, Direct Size, Direct Spec/POM, Sketch Text, Quick contact, Address Direct TEXT↔PHONE_NUMBER, and overall keyboard/input behavior PASS. The slight response delay is `NON_BLOCKING_PERFORMANCE_OBSERVATION`; Phase 3 does not weaken lifecycle safety or add timing hacks.
- Phase 3 permanent closure is `COMMON_ROOT_PAN_RESPONDER_ZERO`, `ROOT_DRAG_HANDLE_ZERO`, `ROOT_FREE_SETTLE_ZERO`, `ROOT_USER_DETENT_ZERO`, `ROOT_DRAG_DISMISS_ZERO`, `ROOT_USER_AUTHORED_Y_ZERO`, `BODY_SCROLL_CANNOT_AUTHOR_ROOT_Y`, `REEL_SCROLL_CANNOT_AUTHOR_ROOT_Y`, `HEADER_BODY_FOOTER_ORDER_STABLE`, `CANCEL_ACTION_EXACTLY_ONCE`, `NESTED_GENERATION_OWNED`, `STATIC_REST_OWNER_ONE`, `KEYBOARD_TARGET_EPHEMERAL`, `SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE`, `STATIC_HIDE_RESTORE`, `TEN_CYCLE_DRIFT_ZERO`, `ACCESSIBLE_COMPLETION_WITHOUT_DRAG`, and `DEVICE_ORIENTATION_RECOMPUTE_DOMAIN_MUTATION_ZERO`.

Subject to the Phase 3 Owner iPhone spot checks, this automated state is `FINALIZATION_READY`. It does not authorize or perform commit, push, tag, release, or alpha.73 finalization.

## Phase 1 implementation evidence

- Completed implementation checkpoint: `ALPHA73D_PHASE1_STATIC_SHEET_PRIMITIVE_CORE_IPHONE_QA_REQUIRED`.
- `WaflInputSheet` has one fixed header and no root responder, drag start/move/release, velocity projection, free-settle, drag-dismiss, handle, or drag-only adjustable accessibility owner.
- `resolveWaflStaticSheetRestingOffset` derives the compatibility resting target from expanded and visible extents. Entrance/close and current system keyboard avoidance remain the only root translation owners.
- Phase 1 retained the then-current focus-cycle/static restore adapter; Phase 2 below supersedes that adapter with current-derived static restore. Body user scrolling remains independently preserved.
- `WaflReelPickerSheet` continues to use the shared shell as `STATIC_REEL_PICKER`: Reel bodies move; the root does not.
- The live inventory now uses the target taxonomy directly. Fullscreen Drawing/image/viewer, due-date calendar, list-row/image/body gestures, footer/action, processing, and nested generation owners are unchanged.
- New Recipe, Direct Size, Direct Spec/POM, Sketch Text, Quick contact, and Address Direct keyboard-class acceptance remain physical QA targets; Phase 1 does not infer them solved.

## Phase 2 implementation evidence

- `mediumOffset`, derived from the current sizing/layout inputs, is the one current static-rest authority.
- `systemKeyboardTargetOffsetRef` is evidence for the current ephemeral keyboard target only. It is cleared on hide, close, and new open and never authors rest.
- `animateTo` requires an explicit `staticRest` or `systemKeyboard` owner. `staticRest` always resolves the current derived rest; `systemKeyboard` is bounded between fully raised `0` and that rest. There is no default commit path.
- `settledOffsetRef`, `preKeyboardSettledOffsetRef`, focus-cycle `rootBaselineOffset`, and `commitSettled` are absent from the live owner.
- Focus-cycle restore owns body position only: system body reveal is absolute replacement, and genuinely observed user body delta is preserved separately.
- Keyboard hide/intentional blur returns root geometry to the current derived static rest. Semantic class transitions retain the incoming-frame guard, and `keyboardDidShow` remains only a current-generation final visibility assertion.
- `SINGLE_ROOT_REVEAL_PER_KEYBOARD_FRAME` scopes root authorship to open generation, focus generation, measurement identity,
  semantic keyboard class, and incoming native frame/inset. Prepared `willChangeFrame` owns the single root target when
  needed. Same-frame duplicate will/did-show/final callbacks cannot author another root target. Without valid prepared
  geometry, final measured `didShow` may claim the still-unused single slot.
- Owner physical QA proved exact-frame ownership insufficient: one keyboard appearance can contain multiple distinct iOS
  frames. `SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE` therefore scopes the upper root-author slot to the current
  open/focus/measurement/semantic-class/appearance generation. Mutable frame geometry updates evidence/body targets without
  creating authority. Initial iOS hidden-to-visible scheduling uses `keyboardWillShow`; state synchronization and later
  frame/did-show callbacks cannot author a second root. A final did-show fallback is allowed only while the appearance slot
  remains unused. Same mounted field layout refresh retains its existing focus/appearance identity.
- Cold-start prepared geometry adds a separate target-geometry revision and direct-input registry revision. Body, header,
  footer, semantic-scope/field layout, registry, or window-layout changes invalidate the captured snapshot even when the
  presentation measurement identity is unchanged. Rejected prepared geometry cannot move body/root or consume the one
  appearance claim; current complete geometry preserves the early fast path, otherwise did-show final measurement may own
  the still-unused single target. This closes the first-focus under-reveal race without restoring a second correction.
- Phase 1 no-root-drag invariants and all content/Reel/fullscreen exceptions remain unchanged.
- New Recipe, Direct Size, Direct Spec/POM, Sketch Text, Quick contact, Address Direct, and long multiline behavior remain owner physical QA targets; automation does not infer PASS.

## 1. Audit baseline and counting method

- LIVE source is authoritative. The intentional alpha.73 dirty continuation and A73C Phase 4 behavior remain unchanged.
- Inventory was generated from all mobile TSX JSX uses of `WaflInputSheet`, `WaflReelPickerSheet`, `WaflPairedOptionReelPickerSheet`, `WaflDecisionSheet`, `InlineDatePicker`, and React Native `Modal`, then expanded by route and user-facing action.
- Direct JSX counts are `WaflInputSheet 26`, `WaflReelPickerSheet 8`, paired reel `1`, `WaflDecisionSheet 3`, `InlineDatePicker 1`, and raw React Native `Modal 7`.
- The 26 `WaflInputSheet` instances include its three shared wrapper sites: one Decision wrapper and the paired/main Reel wrappers. The other 23 instances are feature callsites.
- A wrapper can represent more than one logical surface. The table therefore records every JSX owner and expands Size/Color, Overview direct input, materials, Quick endpoints, and full-view modes explicitly in its surface column.
- No product source, API, schema, dependency, native/config/EAS input, migration, or runtime behavior is changed by this audit.

## 2. Canonical target taxonomy

| Target | Canonical use |
| --- | --- |
| `STATIC_BOTTOM_SHEET` | Short input/action surface with fixed header and deterministic body extent. No root drag. |
| `STATIC_BOTTOM_SHEET_SCROLLABLE` | Long form/list/grid/table. Fixed header, bounded body `ScrollView`, stable footer when required. |
| `STATIC_REEL_PICKER` | Reel or finite option picker in the static shell. Reel movement belongs to the reel body only. |
| `CENTER_DIALOG_CANDIDATE` | Short binary/decision/recovery action that does not need bottom-origin content navigation. |
| `FULLSCREEN_KEEP` | Drawing, PDF, attachment, or image viewing that intentionally owns the full screen. |
| `SPECIAL_FIXED_MODAL_KEEP` | Fixed special-purpose native modal whose interaction is neither a Sheet nor fullscreen content. |

`CENTER_DIALOG_CANDIDATE` is a migration decision, not permission to add a second nested native Modal. Until its phase lands, the current shared Decision lifecycle remains the compatibility owner.

## 3. Exhaustive `WaflInputSheet` inventory

| # | JSX owner | User-facing route/surface | Current sizing / current movement | Body / footer / keyboard / nested | Target | Risk / physical priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `features/feedback/WaflDecisionSheet.tsx` | global destructive Decision; WorkOrder action confirmation; Sketch dirty exit | `reelAdaptive`; draggable/free-settle through wrapper | finite choice reel / V / no keyboard / standalone or nested lifecycle | `CENTER_DIALOG_CANDIDATE` | High: preserve safe default, exactly-once, A73A2 close ordering |
| 2 | `features/inputs/reel-picker/WaflReelPickerSheet.tsx` paired wrapper | Overview Season paired year/season | `reelAdaptive`; draggable/free-settle | two reel bodies / X/V / no keyboard / nested picker | `STATIC_REEL_PICKER` | High regression: current PASS reference |
| 3 | same, main wrapper | target/major/detail; material unit/quantity/loss; partner; production choices; measurement unit; numeric direct mode | `reelAdaptive`; draggable/free-settle | reel or keypad body / X/V / numeric keyboard only in keypad mode / often nested | `STATIC_REEL_PICKER` | High: preserve centered reel and staged apply |
| 4 | `features/MobileWorkOrderExperience.tsx` | `저장하지 못한 변경` recovery | `contentFit`; already fixed | compact body / two recovery actions / no keyboard / root | `CENTER_DIALOG_CANDIDATE` | High: data-loss recovery exactly once |
| 5 | `features/work-orders/list/WorkOrderListScreen.tsx` | Recipe identity filter | `adaptiveExpandable`; draggable/free-settle | filter body scroll / X/V / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | Medium |
| 6 | `features/work-orders/drawing/WorkOrderSketchEditor.tsx` child | Sketch `텍스트 추가` | `adaptiveExpandable`; draggable/free-settle | short text body / footerless canonical confirm / direct input / nested in fullscreen Sketch | `STATIC_BOTTOM_SHEET` | P0 acceptance: intermittent drift; preserve parent open |
| 7 | `features/work-orders/create/WorkOrderCreateSheet.tsx` | `새 레시피` product name + identity row | `adaptiveExpandable`; draggable/free-settle | compact semantic body / footerless native Done / direct input / root | `STATIC_BOTTOM_SHEET` | P0 acceptance: compact reveal |
| 8 | `features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx` first direct route | Season direct input | `adaptiveExpandable`; draggable/free-settle | short body / footerless confirm / manual text / nested | `STATIC_BOTTOM_SHEET` | P0 regression: Owner PASS reference |
| 9 | same, second direct route | Detail item direct input | `adaptiveExpandable`; draggable/free-settle | short body / footerless confirm / manual text / nested | `STATIC_BOTTOM_SHEET` | P0 regression: Owner PASS reference |
| 10 | `features/work-orders/reorder/WorkOrderReorderSheets.tsx` create | `리오더 만들기` | compact/adaptive current shell | short read/action body / X/V / no keyboard / root | `STATIC_BOTTOM_SHEET` | Medium |
| 11 | same, history | `작업 이력` | `adaptiveExpandable`; draggable/free-settle | history list / close action / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | Medium |
| 12 | `features/work-orders/size-color/MeasurementTemplateSheets.tsx` picker | `스펙 불러오기` | `adaptiveExpandable`; draggable/free-settle | template list / X/V + processing / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | High: processing blocker lifecycle |
| 13 | same, company template | `스펙 저장/업데이트`, name/rename/disable | `adaptiveExpandable`; draggable/free-settle | form/list / canonical actions / manual text / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | P0 regression: saved Spec PASS |
| 14 | `features/work-orders/overview/WorkOrderDetailOverview.tsx` readiness | `발행 전 확인` | `adaptiveExpandable`; draggable/free-settle | issue list / close or route / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | Medium |
| 15 | same, material create | `원단 추가`, `부자재 추가` | `expandable`; draggable/free-settle | long form body / stable X/V / text, numeric, multiline / child reels | `STATIC_BOTTOM_SHEET_SCROLLABLE` | P0 regression: use-area/memo PASS |
| 16 | `features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx` | `주소 검색` | expandable/default current shell; draggable/free-settle | search/results body / close / SEARCH keyboard / nested | `STATIC_BOTTOM_SHEET_SCROLLABLE` | P0 automation; physical remains NOT TESTED if API unavailable |
| 17 | `features/work-orders/size-color/SpecItemSelectionSheet.tsx` child | Direct Spec/POM create and rename | `adaptiveExpandable`; draggable/free-settle | short field/helper / canonical create/apply / manual text / nested | `STATIC_BOTTOM_SHEET` | P0 acceptance: compact reveal |
| 18 | same, parent | `스펙 항목 선택` | `expandable`; draggable/free-settle | recommendation/diagram/grid scroll / X/V and same-sheet Decision / no keyboard normally / parent | `STATIC_BOTTOM_SHEET_SCROLLABLE` | High: staged state and Decision |
| 19 | `features/work-orders/documents/QuickDeliveryFoundation.tsx` direct | origin/destination direct address | `expandable`; draggable/free-settle | long form body / stable X/V / TEXT + PHONE_NUMBER / nested handoff | `STATIC_BOTTOM_SHEET_SCROLLABLE` | P0 acceptance: keyboard class switching |
| 20 | same, preview | Quick request preview | `adaptiveExpandable`; draggable/free-settle | read-only preview / close-confirm / no keyboard / nested | `STATIC_BOTTOM_SHEET_SCROLLABLE` | Medium |
| 21 | `features/work-orders/documents/WorkOrderDocumentWorkbench.tsx` Quick main | `퀵 전달` driver/item editor | `expandable`; draggable/free-settle | long mixed form / X/V / text, phone, memo / owns nested routes | `STATIC_BOTTOM_SHEET_SCROLLABLE` | P0 regression: driver/memo PASS; contact risk |
| 22 | same, attachments | `문서에 포함할 첨부` | `expandable`; draggable/free-settle | selectable list / stable X/V / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | High: staged output selection |
| 23 | same, quantities | `사이즈·색상별 수량` | `expandable`; draggable/free-settle | read-only rows / close-confirm / no keyboard / root | `STATIC_BOTTOM_SHEET_SCROLLABLE` | Medium |
| 24 | same, share | `작업지시서 공유` | `contentFit`; fixed | one helper / share action / no keyboard / root | `CENTER_DIALOG_CANDIDATE` | High: external action and pending guard |
| 25 | `features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx` | Color full view, Size full view, Finished Spec full view and inline measurement editing | `fullView`; draggable/free-settle | bounded table/body scroll / X/V / numeric inline keyboard / child unit reel | `STATIC_BOTTOM_SHEET_SCROLLABLE` | High: table scroll and inline edit |
| 26 | `features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx` shared wrapper | Size chooser, Direct Size create, Color chooser, Direct Color palette/create | `expandable` or `adaptiveExpandable`; draggable/free-settle | chooser grids/scroll or short field/palette / X/V/create / direct input only in child / nested | chooser and Color create: `STATIC_BOTTOM_SHEET_SCROLLABLE`; Direct Size: `STATIC_BOTTOM_SHEET` | P0: Size acceptance; Color PASS regression |

The 26-instance table covers every live JSX use. Logical Size/Color modes and material types are expanded in place instead of pretending each wrapper instance is only one user surface.

## 4. Reel consumer inventory

All entries below migrate through the one `STATIC_REEL_PICKER` primitive. No feature-local static picker is authorized.

| Consumer | Logical surfaces | Body owner / keyboard | Nested |
| --- | --- | --- | --- |
| `MaterialPartnerPickerSheet.tsx` | material partner; Quick registered origin/destination partner | finite option reel / none | yes |
| `WorkOrderMaterialEditor.tsx` | new material unit, quantity, loss/allowance | reel; optional explicit keypad mode | yes |
| `WorkOrderMaterialsReadOnly.tsx` | saved material unit, quantity, loss/allowance | reel; optional explicit keypad mode | yes |
| `WorkOrderProductionAuthoring.tsx` | factory, process, partner/status route selected by `activePickerConfig` | finite option reel / none | yes |
| `WorkOrderDetailOverview.tsx` | target audience and major category | finite option reel / none | root child |
| `WorkOrderOverviewPickerSheets.tsx` | detail item; paired Season | finite or paired reel / none | nested |
| `WorkOrderSizeColorReadOnly.tsx` | measurement unit | finite option reel / none | nested in full-view |
| `WaflReelPickerSheet.tsx` internal keypad mode | user explicitly switches WAFL PICK to numeric direct entry | body keypad / number or decimal keyboard | same picker session |

The Reel body keeps vertical wheel movement and haptics. What is retired is only root Sheet dragging. The keypad mode remains part of `STATIC_REEL_PICKER`; it is not promoted to a separate draggable input family.

## 5. Native, special, Decision, and fullscreen inventory

| Raw `Modal` owner | Surface | Target | Exact exception boundary |
| --- | --- | --- | --- |
| `features/inputs/WaflInputSheet.tsx` | shared bottom-sheet host for all rows in section 3 | static target selected per caller | Keep the transparent native presentation host temporarily; remove its root drag behavior |
| `components/InlineDatePicker.tsx` | due-date month calendar | `SPECIAL_FIXED_MODAL_KEEP` | Fixed month grid and local cancel/apply; not a Sheet drag owner |
| `features/work-orders/drawing/WorkOrderSketchEditor.tsx` | Product Sketch | `FULLSCREEN_KEEP` | Drawing canvas/persistence and dirty-close lifecycle remain fullscreen |
| `features/drawing-poc/DrawingRendererPocModal.tsx` | DEV renderer PoC | `FULLSCREEN_KEEP` | DEV-only fullscreen tool |
| `features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx` | authenticated PDF preview/viewer | `FULLSCREEN_KEEP` | Viewer scroll/zoom/navigation remain local |
| `features/work-orders/images/WaflNativeAttachmentViewer.tsx` | native attachment viewer | `FULLSCREEN_KEEP` | Viewer close only |
| `features/work-orders/images/WorkOrderImageGallery.tsx` | image fullscreen carousel | `FULLSCREEN_KEEP` | Horizontal image swipe remains a media gesture exception |

The three live `WaflDecisionSheet` callsites are global feedback, WorkOrder action confirmation, and Sketch dirty exit. They share one `CENTER_DIALOG_CANDIDATE`; no nested RN Modal is added during migration. Active-sheet destructive choice bodies that already replace the same Sheet body remain same-surface state, not a new Dialog.

## 6. Canonical Static Bottom Sheet contract

### 6.1 Geometry owners

1. `staticRestingPosition` is derived from device/window, safe area, content class, and maximum static viewport. It is never user-authored.
2. `keyboardAvoidedPosition` is an optional system-owned position derived from the current keyboard frame and semantic target. It replaces, never adds to, the resting position.
3. `bodyScrollOffset` belongs only to the body `ScrollView`; it is not encoded into root translation.
4. Fullscreen and special fixed exceptions retain their own local geometry and never feed the Sheet policy.

### 6.2 Layout and actions

- Header is fixed and contains no drag handle, adjustable role, or vertical responder capture.
- Short content uses `STATIC_BOTTOM_SHEET`; long list/form/grid/table uses `STATIC_BOTTOM_SHEET_SCROLLABLE` with a bounded viewport.
- Body owns vertical scrolling. A body swipe can never move the root Sheet.
- Footer is a stable sibling when X/V or another persistent action is semantically required. Footer placement does not depend on root drag offset.
- Backdrop, X, Android back, and programmatic close retain canonical cancel/close semantics. There is no drag-dismiss path.
- Processing/Decision body replacement, `onAfterClose`, nested presentation generation, and exactly-once action guards remain intact.

### 6.3 Keyboard and focus

- Sheet presentation and focus remain independent. Manual focus is default; approved prepared focus stays generation-scoped.
- Keyboard owner knows frame, semantic class, show/hide reason, and active generation.
- Long content reveals by actual available body scroll first. Only an unresolved occlusion may request one deterministic system-owned static avoidance position.
- Short content may move as one deterministic keyboard-avoidance unit, but there is no user-set baseline or detent to merge with.
- Already-visible semantic target means root movement `0`.
- Hide restores the static resting position. Repeated focus cycles have zero root/body drift.
- Text↔phone/search/multiline transitions replace the current keyboard frame/class target and cannot inherit a stale frame.
- `keyboardDidShow` remains a guarded final visibility assertion, not a normal second animation owner.

### 6.4 Nested, device, and accessibility

- Nested routes close and reopen by presentation generation and `onAfterClose`, never by drag state.
- Handset portrait and tablet rotation policies remain unchanged. Classification is device-stable; static geometry recomputes deterministically for the current window without changing domain state.
- Accessible dismissal uses labeled X/back/action controls and platform back. No user outcome depends on an adjustable header gesture.
- Focus order, reel accessibility, semantic labels, and stable footer actions remain reachable under VoiceOver/TalkBack.

## 7. Exact drag/detent retirement map

### 7.1 DELETE in implementation Phase 1

| File | Symbol/owner | Reason |
| --- | --- | --- |
| `apps/mobile/features/inputs/WaflInputSheet.tsx` | `dragStartRef`, `dragStartPageYRef`, `dragLastPageYRef`, `dragLastAtRef`, `dragVelocityRef`, `dragReadyRef`, `dragMovedRef`, `dragging` | Root drag state has no target-model owner |
| same | `resetDragState`, `startDrag`, `moveDrag`, `releaseDrag`, `finishDrag` | Header gesture lifecycle is retired |
| same | header `onStartShouldSetResponderCapture`, `onMoveShouldSetResponderCapture`, `onResponderGrant/Move/Release/Terminate`, `onResponderTerminationRequest` | Header no longer captures vertical gestures |
| same | `draggable`, adjustable header role, `wafl-sheet-header-drag-zone`, `styles.dragRegion`, `styles.handle` | Remove drag affordance and drag accessibility |
| same | `userDraggedDuringKeyboardRef` and the keyboard-visible branch that marks it | No user-controlled root geometry remains |
| `apps/mobile/domain/waflSheetDetentPolicy.ts` | `resolveWaflSheetDragStartOffset`, `clampWaflSheetOffset`, `resolveWaflSheetDragOffset`, `shouldCaptureWaflSheetHeaderDrag`, `shouldCaptureWaflSheetDrag`, `resolveWaflSheetRelease` | Free-settle/velocity/dismiss policy becomes unreachable |
| `apps/mobile/domain/waflDirectInputKeyboardPolicy.ts` | `WaflDirectInputDragRelease`, `resolveWaflDirectInputDragRelease` | Keyboard-visible drag dismiss/snap-back is retired |
| `apps/mobile/constants/theme.ts` | `dragZoneMinHeight`, `dragHandleHeight`, `dragHandleWidth`, `dismissDistance`, `dismissVelocity`, `flickVelocity`, `velocityProjectionMs`, `maxVelocityProjection` after last compatible use | Drag-only tokens become dead |

### 7.2 REPLACE, not blind delete

| Current owner | Static replacement |
| --- | --- |
| `WaflSheetDetent`, `mediumDetentRatio`, `expandedDetentRatio`, `mediumOffset`, `settledOffsetRef` | One derived static resting layout plus optional system-only keyboard target. Compatibility prop names may survive one phase but cannot remain semantic detents. |
| `WaflSheetSizing` values `contentFit/adaptiveExpandable/reelAdaptive/expandable/fullView` | Target class + content policy (`compact`, `scrollable`, `reel`, `fullView`). Migrate callers incrementally through an adapter to avoid a 26-callsite flag day. |
| `resolveWaflSheetOpeningOffset` and entrance translation path | Static bottom-origin entrance/exit animation owner; no settle target selection |
| `resolveWaflSheetKeyboardRestoreOffset` and `preKeyboardSettledOffsetRef` | Restore to the derived static resting target; remove the `userDragged` branch |
| `resolveWaflSheetFocusRevealCycle.rootBaselineOffset` and root system delta | Static resting target + current system keyboard target; no inherited user root baseline |
| `resolveWaflSheetKeyboardLayout`, `resolveWaflSheetBodyViewportHeight`, `resolveWaflExpandableInitialHeight`, `resolveWaflAdaptiveInitialHeight` | Static viewport/content-sizing policy with fixed header/footer and bounded body |
| `resolveWaflDirectInputRevealMotion`, merged/floor/prepared entrance/final reconciliation policies | Simplify to semantic visibility + body-scroll-first + optional one system static avoidance target |
| `resolveWaflInputSheetPresentation` sizing/footer logic | Target-class presentation adapter; keep close/action semantics unchanged |
| A73C `Sheet Drag Owner` | Remove from dependency graph. Presentation Owner exposes only static geometry; Body Scroll and Keyboard owners remain separate. |

### 7.3 KEEP temporarily for compatibility

- Existing `sizing` prop and `WaflSheetSizing` union may remain through Phase 1 as an adapter input, but no value may enable root drag.
- `translateY`, `layoutOffset`, `startAnimation`, `animateTo`, close-exclusive suppression, and rendered/open generation remain while they own entrance, exit, and system-only keyboard avoidance.
- `resolveWaflSheetOpeningOffset` may retain its name for one phase only if its output is used exclusively for offscreen entrance.
- Existing historical contracts stay in Verify until their safety intent is covered by the new static contracts; they are then superseded, not silently removed.

### 7.4 KEEP for non-WAFL exceptions

- Drawing canvas PanResponder and WORLD projection.
- Image fullscreen horizontal swipe responder.
- WorkOrder list row swipe actions.
- Reel wheel scrolling/haptics.
- PDF/image viewer scrolling/zooming.
- Ordinary `ScrollView` `onScrollBeginDrag`; it is content scrolling, not root Sheet dragging.

## 8. Keyboard/reveal simplification map

| Current concern | Decision |
| --- | --- |
| Root residual rise merged with user settle offset | Replace with one absolute system-only keyboard target |
| `preKeyboardSettledOffsetRef` | Replace with derived static resting target |
| user-dragged root protection | Delete |
| keyboard-visible drag dismiss/snap-back | Delete |
| compact whole-composition rise | Simplify to measured semantic target and required stable action only |
| `translateY` as entrance + drag + keyboard + close owner | Keep only entrance/close/system avoidance; close stays exclusive |
| didShow second-stage correction | Keep as guarded visibility assertion and rare real-occlusion correction |
| focus-cycle root geometry inheritance | Replace with generation-scoped static baseline; stale cycle has no effect |
| TEXT↔PHONE_NUMBER root rebase | Keep keyboard-class/frame coordination, simplify baseline to the static target |
| mounted semantic refs and validity policy | Keep |
| body metrics, actual forward capacity, scroll-first plan | Keep |
| focus registry, presentation/focus generation, stale callback guards | Keep |
| minimal numeric/phone accessory and Next/Done/Search semantics | Keep |

The deletion target is complexity caused by **user-authored root Y**, not visibility safety. Measurement failure still requires a deterministic minimum usable static viewport; it cannot degrade to a hidden field.

## 9. Quick, Address, and nested migration

- Quick main becomes one `STATIC_BOTTOM_SHEET_SCROLLABLE` parent with stable actions.
- Registered endpoint choice remains `STATIC_REEL_PICKER`.
- Address Direct and Address Search are independent `STATIC_BOTTOM_SHEET_SCROLLABLE` children.
- Parent focus/keyboard closes before child handoff; return focus is an explicit generation-scoped intent.
- Search action remains domain-owned and cannot depend on blur.
- TEXT↔PHONE_NUMBER uses the incoming keyboard frame once; no Quick-local vertical offset.
- Nested transition state is `outgoing close -> onAfterClose -> new presentationGeneration -> incoming open`. Drag state is absent.
- The later Quick IA split remains out of this architecture migration.

## 10. Physical preservation and acceptance map

### 10.1 Regression-protected current PASS

| Surface | Static migration invariant |
| --- | --- |
| Overview Season direct | opens static, explicit focus, no refocus, X/V semantics preserved |
| Overview Detail direct | same; taxonomy/staged state unchanged |
| Direct Color | palette/body interaction unaffected by text focus; no unwanted keyboard |
| Fabric/Accessory new use-area/memo | full semantic multiline block visible via body scroll first |
| Fabric/Accessory saved use-area/memo | inline/save behavior and values unchanged |
| Quick driver name and memo | completion affordance and draft preserved |
| saved Spec/edit | staged selection/name/apply unchanged |
| due-date local cancel | closes only the calendar; parent Overview draft remains |
| target/major/detail taxonomy | dependent-reset and staged integrity unchanged |

### 10.2 Migration acceptance targets

| Surface | Required outcome |
| --- | --- |
| New Recipe | static compact sheet; product field and identity row visible; no double rise/drift |
| Direct Size create | field/helper visible with deterministic keyboard avoidance |
| Direct Spec/POM create | field/helper visible; no cumulative root geometry |
| Sketch Text | child sheet visible, parent remains open, no intermittent drift |
| Quick contact first focus | phone accessory and keyboard target coordinate once |
| Address Direct detail↔contact | ten TEXT↔PHONE_NUMBER switches with no oscillation/drift |

Address Search physical result stays `NOT TESTED` when the owner environment lacks its API. Automated generation/crash/Search guards remain mandatory.

## 11. Permanent contract migration map

| Existing contract | Locked old assumption | Migration decision / preserved safety intent |
| --- | --- | --- |
| `alpha64-free-settle-sheet-physics` | velocity projection, arbitrary release settle, drag-dismiss | Supersede physics; replace with no root responder/no drag-dismiss/static resting contract |
| `alpha64-shared-sheet-architecture-stability` | synchronous drag grant and first move | Supersede gesture assumption; preserve one shared primitive, atomic entrance, close ownership, nested independence |
| `alpha64-physical-ui-regression` | header capture, drag zone/handle | Replace with fixed header, labeled controls, body-scroll ownership, touch targets |
| `alpha64-real-sheet-category-spec` | medium offset, continuous drag/release | Preserve category/spec routes and staged X/V; replace geometry assertions |
| `alpha64-spec-catalog-sticky-sheet` | draggable sheet tokens and release | Preserve sticky/scroll catalog behavior; replace with static scrollable viewport |
| `alpha64-contentfit-footer-sizecolor-inset` | gesture markers on common sheet | Preserve footer/body/safe-area order and Size/Color inset; remove gesture assertions |
| `alpha64-sheet-actions-quick-address-nested` | header drag and medium target | Preserve X/V, Quick nested handoff, fixed footer, generation ordering |
| `alpha64-keyboard-focus-sheet-actions` | pre-settled user geometry and user-drag restore | Preserve semantic reveal, mounted measurement, body-scroll-first, hide restore; replace restore baseline |
| `alpha64-input-sheet-ux-semantics-stability` | `settledOffsetRef`/adaptive detent | Preserve presentation/action semantics; replace with static target classes |
| `alpha65-common-picker-physical-drag` | picker header follows finger/free-settles | Supersede root drag; preserve reel value scroll, haptics, staged X/V, first-real-option consistency |
| `alpha65-production-physical-parity-save-picker` | Production picker inherits common drag | Preserve one active picker, save parity, option staging; migrate to static reel |
| `alpha65-sheet-inventory-reusable-create-active-geometry` | 22 surfaces classified draggable | Supersede inventory taxonomy with this exhaustive static map; preserve active nested state and reusable-create shell |
| `alpha68-direct-input-single-geometry-drag-submit-fix` | keyboard-visible drag dismiss/snap-back | Delete drag branch; preserve submit-before-blur, canonical confirm, no duplicate mutation, no keyboard-only state |
| `alpha68-create-sheet-keyboard-restore-blocker-parity` and related alpha68 restore/reveal contracts | user drag may own keyboard restore | Preserve exact resting restore, blocker, measured reveal; replace user root with static baseline |
| `alpha73B2/B3/B4/B5/B6` keyboard contracts | system reveal merged with settled/user root | Preserve presentation-before-focus, floor, prepared geometry, keyboard class, final semantic classifier; simplify root baseline |
| `alpha73C Phase 1` | direct create manual focus, later drag policy still present | Preserve manual focus; delete deferred drag owner |
| `alpha73C Phase 2` | header drag dismisses keyboard then generic free-settle | Supersede drag path; preserve explicit blur/dismiss, no auto-refocus, action grammar, crash guards |
| `alpha73C Phase 3` | user-drag root restore exception | Preserve root/body separation and zero drift; static root removes the exception |
| `alpha73C Phase 4` | absolute system compensation over current root | Preserve keyboard class/frame coordination and absolute replacement; root becomes derived static baseline |

No old test is deleted in Phase 1 until the replacement contract covers its non-drag safety assertions. Tests mixing drag and unrelated safety must be split or rewritten, not removed wholesale.

### 11.1 New permanent Static Sheet contracts

1. Every live surface is mapped to exactly one target class.
2. Common Sheet header has no root PanResponder, drag handle, adjustable role, free-settle, detent selection, or drag-dismiss.
3. Body swipe changes only body scroll; root target remains static.
4. Fixed header/body/footer/safe-area order holds for compact and long content.
5. Reel movement cannot move the root Sheet.
6. Backdrop/X/back cancel and V/Done/Search business actions remain exactly once.
7. Keyboard target is absolute system-owned state; already-visible means movement zero.
8. Long content uses real body capacity first; residual static avoidance is bounded.
9. Keyboard hide returns to the derived resting target; ten cycles drift zero.
10. Nested handoff is generation-owned and leaves no stale focus, overlay, or parent close.
11. Decision, fullscreen, calendar, Drawing, PDF, attachment, and image exception classifications are explicit.
12. VoiceOver/TalkBack can dismiss and confirm without a drag gesture.
13. Handset/tablet/orientation geometry is deterministic and domain state is unchanged.

## 12. Migration phases

### Phase 1 — Primitive Static Core

- Add static target-class compatibility policy and make all existing `WaflInputSheet` sizing values render without root drag.
- Remove header responder/handle/accessibility-adjustable behavior and root drag/free-settle/drag-dismiss functions.
- Establish fixed header, bounded body, stable footer, static resting target, and entrance/close-only translation.
- Migrate paired/main Reel wrappers to `STATIC_REEL_PICKER`; keep reel body physics.
- Replace core alpha64/65 drag assertions with static invariants while preserving action, scroll, footer, lifecycle, and picker safety.
- Physically gate broad representative surfaces before Phase 2.

### Phase 2 — Keyboard/Input Migration

- Simplify restore/reveal cycles around derived static resting and absolute system keyboard targets.
- Remove user-root protection and keyboard-visible drag branches.
- Validate compact direct input, long/multiline body-scroll-first, numeric/phone accessory, class transitions, Search, Quick nested return focus, and Sketch Text.
- Preserve A68 close-exclusive and A73A2/B1 modal ordering.

### Phase 3 — Remaining surfaces and cleanup

- Verify filters, histories, readiness, templates, attachment selection, quantities, preview, full-view tables, recovery, calendar, Decision candidate, and fullscreen exceptions.
- Remove compatibility sizing/detent names and dead theme tokens only after all callers migrate.
- Complete docs/test cleanup, accessibility matrix, handset/tablet/orientation matrix, and owner physical matrix.
- Only then decide alpha.73 finalization.

## 13. Next implementation phase after Phase 2

Phase 3 remains separately scoped and must follow owner physical evidence for Phase 2. Its future checkpoint/package is not invented here.

### Candidate primary files

- remaining sizing-compatibility callsites identified by the live inventory
- filters, histories, readiness, templates, attachment selection, quantities, preview, and full-view table surfaces
- accessibility and handset/tablet matrices
- compatibility naming/theme cleanup only when every caller is migrated
- Decision candidate only under a separately approved product scope

### Candidate behavior scope

- Preserve the Phase 1 non-draggable root and Phase 2 static-rest/ephemeral-keyboard ownership.
- Verify and migrate remaining surface sizing without broad IA changes.
- Keep body/Reel/fullscreen gesture exceptions, fixed footer/action behavior, and nested lifecycle semantics.
- Remove compatibility terms only after source and physical evidence proves no caller relies on them.

### Contract scope

- Phase 1 root-drag and Phase 2 keyboard-target contracts remain permanent.
- Current initial visible extents remain within the compatibility contract until individually migrated.
- Footer/body/safe-area, cancel/confirm, processing, nested handoff, close-exclusive, and exception gestures pass.

### Explicit out of scope

- Further keyboard/reveal redesign, callsite-specific sizing redesign, Quick IA split, Decision visual redesign, Drawing/PDF/Image behavior, API/schema/migration, dependency/native/config/EAS, production rollout, version bump, commit/push/release/finalization.

### Owner iPhone QA matrix

1. New Recipe, Season direct, Detail direct, Direct Size, Direct Color, Direct Spec/POM, saved Spec.
2. Confirm header does not drag; body scroll works; backdrop/X/back cancel; V/Done applies once.
3. Material Fabric/Accessory long form and multiline body scroll; footer stays reachable.
4. Target/major/detail/Season reels: wheel scroll works, root does not move, X/V unchanged.
5. Quick main, partner picker, Address Direct, Address Search where available, preview; nested return leaves no stale overlay.
6. Full-view Size/Color/Spec table scroll and unit picker.
7. Due-date calendar local cancel, Sketch fullscreen/dirty Decision, PDF/attachment/image fullscreen unchanged.
8. Handset portrait and available tablet rotation smoke; no domain mutation.

### Safety boundary

- Preserve the intentional alpha.73 dirty continuation and retained QA Recipe.
- No reset/restore/clean/stash/rebase/amend/history rewrite.
- No API/schema/dependency/native/config/EAS/migration or Production/Owner/ambiguous mutation.
- No automatic physical PASS inference; failure stops before version/Git/release actions.

## 14. Audit completion boundary

- Product behavior delta: `0`.
- API/schema/dependency/native/config/EAS delta: `0/0/0/0/0/0`.
- Migration and data mutation: unchanged/zero.
- Commit/push/tag/release/finalization: `0/0/0/0/0`.
- Owner physical evidence accepts the Phase 2 blocker and Phase 3 Static Sheet surface checks. The subsequent shared
  keyboard-reveal latency correction keeps those correctness invariants and permits a trustworthy, bottom-anchored iOS
  will-show/will-change frame with current prepared geometry to claim the one appearance root slot before did-show. Unsafe
  early events make no body/root change; did-show remains the one safe fallback. Latency physical PASS is never inferred.

## 15. Compact explicit-semantic target correction

- Static compact layout does not imply that all body content is required. Ordinary fields retain the Phase 4
  measured-field-only safety rule.
- An explicit `WaflSheetSemanticFocusScope` declares its complete current rectangle as required composition,
  including footerless body controls such as New Recipe's work-character buttons.
- The current prepared explicit target is a stricter downstream bound and survives visibility-floor/measured
  merging and legal static-root clamping before the one keyboard-appearance root claim.
- `393x852` deterministic evidence resolves expanded/static/keyboard to `801/523/308`, scope `0..168`,
  canonical root target `197`, semantic bottom `472`, keyboard top `544`, and clearance `72`.
- A second visible root repair, local feature offset, broad compact expansion, and physical PASS inference
  remain forbidden.
