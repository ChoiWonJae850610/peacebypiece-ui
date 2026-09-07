# WAFL v2 App-first Roadmap and Version Delta

Alpha.74 is finalized at `ALPHA74_FINALIZATION_COMPLETE` with accepted product checkpoint `ALPHA74_COMPLETE`.
Owner actual physical QA passes iPhone and iPad mini for the finalized Drawing and portrait policy: compact-device
content/native-window rotation motion, bounce, and split-layout flash are `0`; Recipe/tab/Sketch continuity and
pen/line/arrow/rectangle/ellipse, alignment, mixed Undo/Redo, and the one iPad Save/close/reopen WORLD Scene pass.
Regular/Large iPad and Android actual-device QA remain `NOT_RUN`, not blockers or inferred PASS. APP_VERSION is
`2.0.0-alpha.74`; Scene v1, migration `22/22`, Production `스케치(준비 중)`, tag/release `0/0`, and data safety remain.
The next recommended alpha.75 boundary is shared WORLD hit-testing, selection, object delete, and eraser; it is not
started by alpha.74 finalization.

Alpha.74 iOS Compact Native app/window orientation-mask correction is implemented at
`ALPHA74_IOS_COMPACT_NATIVE_ORIENTATION_MASK_QA_REQUIRED`. Owner iPad-mini video narrowed the remaining failure to
outer native-window rotation motion after React content, split-layout continuity, root native-stack portrait policy,
and `UIRequiresFullScreen` were already correct. The Expo config plugin now reproducibly injects the top AppDelegate
mask using logical `min(screen.width, screen.height)` and the shared `768` regular-tablet boundary: handset/compact
tablet return portrait; regular tablet delegates to Expo's existing subscriber intersection and retains landscape.
Info.plist remains broad for iPad, runtime Product Sketch transitions and Android policy remain intact. Existing-project
iOS `development`/internal build `90ec13f2-b6ec-4e2e-baba-c1195161a69c` finished after all gates with no credential,
Team, bundle, or registered-device change. Dependency/API/schema/migration/version and business data remain unchanged;
Owner physical zero-motion PASS is not inferred.

Alpha.74 Compact Tablet zero-rotation-motion correction is implemented at
`ALPHA74_COMPACT_TABLET_ZERO_ROTATION_MOTION_REQA_REQUIRED`. Owner iPad-mini evidence on the fullscreen-enabled build
showed a visible rotate/bounce and transient split layout before portrait restoration. The already-approved
orientation-invariant device class now owns both the root Expo Router native-stack `orientation` option and Recipe
responsive presentation: handset/compact tablet resolve to `portrait_up` plus phone-like presentation, while regular
tablet resolves to `default` and remains tablet-eligible. Runtime reconciliation, `UIRequiresFullScreen`, broad iPad
native orientation metadata, Product Sketch portrait scope/Modal, stable detail-host identity, Drawing, API/schema,
dependencies, native/config/EAS, migration, and version remain unchanged. The installed Development Build is reused;
Owner physical no-motion PASS is not inferred.

Alpha.74 iOS fullscreen orientation native prerequisite is implemented at
`ALPHA74_IOS_FULLSCREEN_ORIENTATION_NATIVE_BUILD_QA_REQUIRED`. The existing compact-tablet base portrait policy,
regular/large-tablet rotation policy, Product Sketch portrait scope, native orientation arrays, and stable responsive
detail host are retained. Expo iOS config adds only `requireFullScreen: true`; generated SDK55 Info.plist introspection
proves `UIRequiresFullScreen: true`, accepting the product consequence that iPad Split View and Slide Over are disabled.
One and only one new existing-project internal `development` build was submitted after all pre-build gates passed. Build
`035dd0f3-8be1-4c24-8cd0-6759788bebef` finished successfully with public version `2.0.0` and build number `1`; Owner
iPhone/iPad installation and physical QA remain. Dependency, API/schema/migration, APP_VERSION, Git, release, and
business-data mutation remain unchanged; physical PASS is not inferred.

Alpha.74 compact-tablet and Product Sketch portrait policy is implemented at
`ALPHA74_COMPACT_TABLET_SKETCH_PORTRAIT_POLICY_QA_REQUIRED`. The product now treats phone and compact tablet as
portrait-only, regular/large tablet base WAFL as portrait+landscape, and Product Sketch as portrait-only on every mobile
device class. Device class is orientation-invariant: iOS retains its tablet idiom, Android retains the 600dp native tablet
boundary, and both use the physical-screen short side with the existing canonical 768 responsive token to distinguish
compact from regular tablet. A root orientation provider remains the sole native-call owner; Product Sketch acquires a
declarative portrait scope and close restores the base policy. Stable responsive Recipe detail identity and the complete
Drawing WORLD/viewport/persistence architecture remain. Dependency/native/config/EAS/API/schema/migration delta is zero,
APP_VERSION stays `2.0.0-alpha.73`, and physical PASS is not inferred.

Alpha.74 iPad responsive Recipe-detail subtree continuity correction is implemented at
`ALPHA74_IPAD_RESPONSIVE_DETAIL_CONTINUITY_REQA_REQUIRED`. The first Sketch-local Modal orientation correction remains,
but Owner iPad physical QA failed identically in both directions. LIVE React identity analysis proved the responsive
tablet/phone branch replaced the selected detail subtree and reset its local tab/gallery/Sketch visibility state. The
bounded correction renders one stable keyed detail host across responsive mode changes while preserving list/detail
visibility and layout policy. Breakpoint numbers, iPhone/tablet orientation policy, Drawing geometry/persistence,
dependencies, native/config/EAS, API/schema, and migration remain unchanged. APP_VERSION stays `2.0.0-alpha.73`; Owner
iPad lifecycle, geometry, stale-gesture, and one-Save/Reopen re-QA remains required.

Alpha.74 iPad Product Sketch fullscreen orientation lifecycle correction is implemented at
`ALPHA74_IPAD_SKETCH_ORIENTATION_LIFECYCLE_REQA_REQUIRED`. Actual iPhone portrait QA passed and consumed its one Save;
actual iPad rotation in either direction dismissed the fullscreen Sketch with no active gesture and no iPad Save. The
bounded correction adds the explicit four-orientation contract to Product Sketch's React Native fullscreen Modal. It
does not claim the precise native dismissal callback, change global phone/tablet orientation policy, or touch other
fullscreen surfaces, Drawing geometry/persistence, dependency/native/config/EAS, API/schema, or migration. APP_VERSION
stays `2.0.0-alpha.73`; Owner iPad rotation/geometry/stale-gesture/one-Save re-QA remains required.

Alpha.74 responsive Product Sketch shape authoring is implemented at
`ALPHA74_SKETCH_RESPONSIVE_SHAPE_AUTHORING_IPHONE_IPAD_QA_REQUIRED`. The authenticated DEV/TEST toolbar adds
`사각형 / 타원` through one pure WORLD-coordinate bounded-shape session and one viewport-generation cancellation guard.
Scene v1, persistence/API, production exposure, dependencies, native/config/EAS, and migration remain unchanged;
APP_VERSION stays `2.0.0-alpha.73` and Owner iPhone/iPad physical PASS is not inferred.

Alpha.73 is finalized at `ALPHA73_FINALIZATION_COMPLETE` with accepted product checkpoint `ALPHA73_COMPLETE`. Product
Sketch retains the Owner-accepted pen/line/arrow/text, mixed history, explicit Save/reopen, and dirty-discard behavior;
release/production still exposes only disabled `스케치(준비 중)`. The Owner's final actual-iPhone statement
`다 잘된다. 이제 키보드는 다 되는거같다` is canonical `OWNER_IPHONE_PHYSICAL_PASS` for the A73D Keyboard / Static
Sheet gate only, superseding that chain's intermediate failures without inventing cycle counts. Static root drag,
free-settle, user detent, drag-dismiss, and drag handle remain retired. APP_VERSION is `2.0.0-alpha.73`; DEV/TEST migration
is `22/22`, Production migration is zero, and finalization adds no behavior, API/schema, dependency/native/config/EAS,
or business-data mutation. It is the finalized baseline for the bounded alpha.74 candidate above.

Alpha.73D Quick phone return-key opt-out is implemented at
`ALPHA73D_QUICK_PHONE_RETURN_KEY_OPT_OUT_FIX_IPHONE_QA_REQUIRED`. The shared ValueField passes the existing typed
return-key policy through with default `auto`; only Quick driver-contact and nested address-contact phone-pad fields use
`none`. They keep PHONE_NUMBER, accessory `none`, registered handoff, root/body planning, and nested Sheet X/V, while
Quick Search, ordinary direct text, numeric direct, and all other phone-pad behavior remain unchanged. This is a bounded
causal test with no geometry, API/schema, dependency/native/config/EAS, migration, or data mutation delta. Permanent
inventory advances to `264/264`; APP_VERSION stays `2.0.0-alpha.72`, and physical PASS is not inferred.

Alpha.73D Quick phone accessory geometry correction is implemented at
`ALPHA73D_QUICK_PHONE_ACCESSORY_GEOMETRY_FIX_IPHONE_QA_REQUIRED`. The shared ValueField passes the existing typed
accessory policy through with default `auto`; only Quick driver-contact and nested address-contact phone-pad fields select
`none`. Both remain PHONE_NUMBER registered inputs with unchanged semantic regions, completion behavior, and nested
Sheet X/V, while other phone/number inputs keep automatic minimal accessories. Nested keyboard ownership,
structural/runtime geometry separation, capture-only recapture, current-root/live-body planning, New Recipe, Spec Save,
Direct create, and numeric direct geometry are unchanged. Permanent inventory advances to `263/263`; APP_VERSION stays
`2.0.0-alpha.72`, and physical PASS is not inferred.

Alpha.73D nested keyboard ownership and structural prepared-geometry refresh are implemented at
`ALPHA73D_NESTED_KEYBOARD_OWNER_PREPARED_RECAPTURE_AND_NUMERIC_DISPLAY_FIX_IPHONE_QA_REQUIRED`. The topmost rendered
direct-input Sheet exclusively owns global keyboard geometry events; underlying nested parents record but do not mutate.
Runtime scroll metrics no longer advance the structural prepared revision, and a true structural change can recapture the
next-focus snapshot while the keyboard is visible without moving root or body. Numeric opening-value formatting is
presentation-only. Permanent inventory advances to `262/262`; APP_VERSION stays `2.0.0-alpha.72`, and physical PASS is
not inferred.

Alpha.73D live-root baseline, visibility-only residual scroll, and numeric return-key correction is implemented at
`ALPHA73D_LIVE_ROOT_BASELINE_RESIDUAL_SCROLL_AND_NUMERIC_RETURN_KEY_FIX_IPHONE_QA_REQUIRED`. A keyboard-visible
registered handoff plans from the authoritative current `systemKeyboard` target instead of static rest. The planner
allocates any remaining legal root reveal, then scrolls only for actual clipping; bottom keyboard clearance is not reused
as a top alignment margin. Numeric direct retains inline X/V while requesting neither a WAFL InputAccessoryView nor a
WAFL return-key completion action. Quick/numeric DEV evidence surfaces are persisted for the next physical run. The
permanent inventory advances to `261/261`; APP_VERSION stays `2.0.0-alpha.72`, all mutation/release budgets remain zero,
and Physical PASS is not inferred.

Alpha.73D live body-scroll authority and numeric mode-transition correction is implemented at
`ALPHA73D_LIVE_BODY_SCROLL_AUTHORITY_AND_NUMERIC_MODE_TRANSITION_FIX_IPHONE_QA_REQUIRED`. Direct-input reveal no longer
treats the capture-time body offset as live truth: current body scroll is read when each keyboard transaction is planned,
and signed system deltas are bounded by actual forward/back capacity. New independent appearances reset cycle deltas;
only a validated registered-input handoff transfers them. Numeric Reel-to-keypad now suppresses intermediate static-root
settling and focuses after current prepared geometry is ready, while its inline X/V owner replaces the redundant numeric
accessory. Quick phone-pad completion is unchanged. The permanent inventory advances to `260/260`. APP_VERSION stays
`2.0.0-alpha.72`; dependency/native/config/EAS, API/schema/migration, data, Git, and release state are unchanged. Physical
PASS is not inferred.

Alpha.73D Quick root-first reveal and numeric direct-input UI correction is implemented at
`ALPHA73D_QUICK_ROOT_FIRST_REVEAL_AND_NUMERIC_DIRECT_INPUT_UI_FIX_IPHONE_QA_REQUIRED`. Quick Delivery surfaces select
the shared root-first allocation policy: one prepared keyboard transaction allocates legal static-root reveal before
the minimum residual body scroll, without a late recovery writer. Explicit semantic input focus is replayed only after
canonical body-content geometry exists, so a null semantic rect cannot consume the appearance claim and raw parent-local
geometry cannot substitute. Numeric keypad mode joins the shared direct-input prepared lifecycle and renders one compact
mode/action row using the canonical X/V component; its default footer is suppressed. A fixed status region retains the
session-opening value and validation without value-edit extent churn. APP_VERSION stays `2.0.0-alpha.72`; dependency/
native/config/EAS, API/schema/migration, data, Git, and release state are unchanged. Physical PASS is not inferred.

Alpha.73D semantic-coordinate normalization, Quick Delivery reveal, and numeric keypad composition are implemented at
`ALPHA73D_SEMANTIC_COORDINATE_NORMALIZATION_QUICK_REVEAL_AND_NUMERIC_KEYPAD_FIX_IPHONE_QA_REQUIRED`. Every shared
semantic focus target used by prepared keyboard reveal is now measured relative to the canonical Sheet body-content
ancestor; nested card-local `onLayout` coordinates are retained only as evidence and cannot author prepared geometry.
Quick driver/address fields consequently compute non-animated body-scroll-first reveal in the same appearance transaction.
Numeric direct mode treats its input, fixed auxiliary status slot, and `WAFL PICK으로 변경` row as one semantic region;
the deterministic Reel extent includes the shared body-end-gap token. Existing root owners, one visible reveal, registered
handoff, New Recipe, Spec Save, and Direct Create behavior remain intact. APP_VERSION stays `2.0.0-alpha.72`; dependency/
native/config/EAS, API/schema/migration, data, Git, and release state are unchanged. Physical PASS is not inferred.

Alpha.73D registered-input handoff, Quick Delivery semantic targeting, and numeric Reel stability are implemented at
`ALPHA73D_REGISTERED_INPUT_HANDOFF_QUICK_DELIVERY_AND_NUMERIC_REEL_STABILITY_FIX_IPHONE_QA_REQUIRED`. Mounted input native
identities now distinguish a same-Sheet field handoff from a true non-input body tap, preventing the generic dismiss path
from creating a full hide/static-rest/refocus cycle. Quick driver and direct-address editable fields each own an explicit
semantic region. The shared quantity picker reserves a deterministic auxiliary status slot in both Reel and keypad modes;
legacy/validation/empty changes leave body and root extent unchanged, while a real mode switch may choose one new derived
extent. Existing generation-scoped root writers and one-reveal-per-appearance rules are preserved. APP_VERSION stays
`2.0.0-alpha.72`; dependency/native/config/EAS, API/schema/migration, data, Git, and release state are unchanged. Physical
PASS is not inferred.

Alpha.73D root-animation ownership and Direct Create semantic-target correction is implemented at
`ALPHA73D_ROOT_ANIMATION_OWNERSHIP_AND_DIRECT_CREATE_SEMANTIC_TARGET_FIX_IPHONE_QA_REQUIRED`. Actual-device
evidence separated requested target from native applied root and proved that a still-active `staticRest` animation
could survive a new keyboard appearance when a stale JavaScript completion value made the keyboard target look like
a no-op. Root motion now has one explicit generation-scoped owner (`entrance`, `staticRest`, `systemKeyboard`, or
`exit`); incompatible restore is superseded, and `trueNoop` is a terminal resolved state rather than an implicit
absence of work. Direct Size and Direct Spec/POM reusable create forms declare field plus helper as their semantic
region without pulling unrelated body content or Direct Color palette into reveal. One visible root writer, static
hide restore, and the shared semantic gap remain. APP_VERSION stays `2.0.0-alpha.72`; dependency/native/config/EAS,
API/schema/migration, data, Git, and release state are unchanged. Physical PASS is not inferred.

Alpha.73D keyboard focus-ordering and semantic-clearance correction is implemented at
`ALPHA73D_KEYBOARD_FOCUS_ORDERING_AND_SEMANTIC_CLEARANCE_FIX_IPHONE_QA_REQUIRED`. A native iOS keyboard
will-frame that precedes the React Native focus callback is retained only inside the current Sheet/open/layout/
measurement identity. Matching focus consumes it through the existing keyboard-timed single-root transaction;
the candidate itself owns no mutation or claim, and stale/duplicate/dismissed candidates are discarded. Explicit
semantic scopes now use the shared semantic gap while ordinary fields retain their existing focus context. New
Recipe keeps product/helper/work-character/buttons in one scope, and Spec Save new mode declares name plus mode
buttons as its scope. No local offset, delay, second root correction, drag owner, API/schema/migration/dependency/
native/config/EAS or data change was added. APP_VERSION remains `2.0.0-alpha.72`; physical PASS is not inferred.

Alpha.73D actual-device final-geometry evidence is implemented at
`ALPHA73D_NEW_RECIPE_ACTUAL_DEVICE_FINAL_GEOMETRY_EVIDENCE_IPHONE_QA_REQUIRED`. It is an instrumentation-only
checkpoint for Owner cold-first-focus New Recipe and Spec Save reference capture. The shared Static Sheet
motion/root transaction and input behavior are unchanged. Machine-readable `new-recipe` / `spec-save-new`
events persist ordered native keyboard frames, target/claim decisions, body scroll, and actual post-frame
window rectangles including the work-character choice row. The sink is DEV + external-QA-only, local ignored
JSONL, bounded, authenticated, and Production-disabled. APP_VERSION remains `2.0.0-alpha.72`; dependency,
native/config/EAS, API business contracts, schema/migration, data, Git, and release state are unchanged.
Actual Owner evidence must precede diagnosis or a product correction; physical PASS is not inferred.

Alpha.73D Spec Save motion reference and layout normalization is implemented at
`ALPHA73D_SPEC_SAVE_MOTION_REFERENCE_LAYOUT_NORMALIZATION_IPHONE_QA_REQUIRED`. Owner-selected Spec Save
motion remains the shared direct-input reference without forking animation code. New-save composition is
name input followed by the new/update mode selector; update composition keeps the selector ahead of its long
template and management content. Spec Save retains minimal field reveal, while New Recipe retains the larger
explicit semantic-region target through the same appearance/root scheduling owner. APP_VERSION remains
`2.0.0-alpha.72`; dependency/native/config/EAS, API/schema/migration, data, Git, and release state are unchanged.
Physical PASS is not inferred.

Alpha.73D compact semantic target formula correction is implemented at
`ALPHA73D_COMPACT_SEMANTIC_TARGET_FORMULA_UNDER_REVEAL_IPHONE_REQA_REQUIRED`. A compact field's
surrounding body remains advisory unless a real footer or an explicit `WaflSheetSemanticFocusScope`
declares the larger composition. For New Recipe, the product/helper/work-character/button scope is an
explicit requirement. Its current prepared target is preserved through visibility-floor and measured-
target merging, then consumed by the existing single appearance root owner. DEV/external-QA evidence now
records the complete target chain and resulting keyboard clearance. No local offset, second root repair,
or broad compact expansion was added. APP_VERSION remains `2.0.0-alpha.72`; other product, data, native,
dependency, migration, Git, and release state is unchanged. Owner physical PASS is not inferred.

Alpha.73D cold-start semantic-scope registration replay is implemented at
`ALPHA73D_COLD_START_SEMANTIC_SCOPE_REGISTRATION_REPLAY_IPHONE_REQA_REQUIRED`. A semantic scope's first native `onLayout`
can no longer be lost when it precedes input subscription: the input installs its listener in a layout-synchronous phase,
then immediately re-registers the current stored rectangle. An unchanged replay does not churn revisions; a newly observed
full scope advances registry/geometry revisions and invalidates stale prepared geometry. Early keyboard fast-path trust now
also proves registry geometry equals the live scope and prepared geometry equals the registry. Missing/stale semantic data
moves neither body nor root and consumes no root slot; current geometry or final measured fallback may author the one target.
New Recipe's full product/helper/work-character/button composition, warm fast path, single-root, static restore, and drift
contracts remain. APP_VERSION is `2.0.0-alpha.72`; dependency/native/config/EAS, API/schema/migration, production data, and
Git/release state are unchanged. Owner cold-start physical PASS is not inferred.

Alpha.73D cold-start first-focus geometry freshness is implemented at
`ALPHA73D_COLD_START_FIRST_FOCUS_GEOMETRY_FRESHNESS_IPHONE_REQA_REQUIRED`. A prepared direct-input snapshot is now trusted
only when its open/focus/keyboard class/layout identity and explicit target-geometry plus registry revisions still match,
all required body/header/footer measurements are complete, and the current semantic target is represented. A stale cold-
start snapshot authors body/root `0/0` and consumes no appearance root claim. The first current trustworthy frame retains
the fast path; when early current geometry is unavailable, did-show final measurement may own the one unused root target.
The New Recipe semantic scope still includes product name, helper, work character, and both character buttons. Existing
single-root-per-appearance, static hide restore, keyboard-class transition, and drift contracts remain. APP_VERSION is
`2.0.0-alpha.72`; dependency/native/config/EAS, API/schema/migration, production data, and Git/release state are unchanged.
Owner physical cold-start PASS is not inferred.

Alpha.73D keyboard-reveal latency evidence/safe-fast-path is implemented at
`ALPHA73D_KEYBOARD_REVEAL_LATENCY_EVIDENCE_SAFE_FAST_PATH_IPHONE_REQA_REQUIRED`. It preserves the accepted Static Sheet
correctness and changes only when the existing system target may begin. A current, anchored iOS native will-show or
will-change frame with fresh prepared local geometry may claim the one appearance-level root slot immediately and start
the keyboard-timed body/root plan in that callback. Provisional or stale events author neither body nor root; if no safe
early frame exists, did-show final measurement remains the sole fallback. Later events in the same appearance cannot make
a second root animation. DEV/external-QA monotonic structured evidence identifies trust, schedule, start, fallback, and
restore, while product UI and focus timing are unchanged. APP_VERSION is `2.0.0-alpha.72`; dependency/native/config/EAS,
API/schema/migration, production data, and Git/release state are unchanged. Owner physical latency PASS is not inferred.

Alpha.73D Phase 3 closes the Static Sheet migration at
`ALPHA73D_PHASE3_STATIC_SHEET_REMAINING_SURFACES_CLEANUP_IPHONE_QA_REQUIRED`. The LIVE JSX/native recount remains
`26 / 8 / 1 / 3 / 1 / 7` for shared Sheet, Reel, paired Reel, Decision, calendar, and raw Modal hosts. The expanded
source-owned product inventory covers 44 logical surfaces across compact Static, scrollable Static, Static Reel, Decision
candidate, fullscreen, and special fixed Modal classes. The last live theme/policy detent parameter names are now static-
extent names with identical values; the broad sizing union and policy filename remain compatibility routes only. Common
root drag/free-settle/user-detent/drag-dismiss/accessibility owners are zero, while body, Reel, Drawing, image, row-swipe,
and viewer gestures remain explicitly scoped exceptions. Phase 2 Owner physical keyboard/input results are recorded as
PASS and the slight delay remains non-blocking. Phase 3 physical PASS and tablet/Android physical PASS are not inferred.
Subject to the Phase 3 iPhone spot checks, the automated state is `FINALIZATION_READY`; finalization remains a separate
explicit package.

Alpha.73D Phase 2 New Recipe keyboard-appearance blocker correction is implemented at
`ALPHA73D_PHASE2_NEW_RECIPE_KEYBOARD_APPEARANCE_SINGLE_REVEAL_IPHONE_REQA_REQUIRED`. The prior exact-frame checkpoint
physically failed because a single iOS keyboard appearance can emit multiple distinct frames. Phase 1's fixed header and
non-draggable root remain.
The current derived sizing target is the only static rest; system keyboard reveal is a bounded ephemeral absolute target,
never a captured/session rest. Hide/blur restores the current derived target. Focus cycles retain body-scroll ownership only,
with actual-capacity-first absolute replacement and generation-guarded final visibility reconciliation. TEXT ↔ PHONE_NUMBER
continues to wait for the fresh incoming frame. `SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE` gives one explicit
open/focus/measurement/class/appearance transaction at most one visible root animation across all intermediate/final native
frames and React inset synchronization. iOS initial hidden-to-visible scheduling uses `keyboardWillShow`; frame-change and
did-show remain evidence/body/assertion owners after a root claim. Without a prior stable target, final measured did-show may
claim the transaction's still-unused fallback. The exact-frame contract remains a lower-level duplicate-event guard.
Footer/action/processing/nested lifecycle, Reel/content/fullscreen gestures,
and regression-protected inputs are unchanged. Remaining callsite sizing cleanup, Quick IA, Decision redesign, and
Drawing/API/schema work remain separate. APP_VERSION and migration remain `2.0.0-alpha.72` and 22/22; physical PASS is not inferred.

Alpha.73C Phase 4 is implemented at
`ALPHA73C_PHASE4_COMPACT_REVEAL_KEYBOARD_CLASS_TRANSITION_IPHONE_REQA_REQUIRED`. It preserves Phase 3 explicit manual focus,
Overview integrity/taxonomy, system-vs-user restore, Quick Search guards, numeric accessory, and stable Address Direct actions.
Compact planning reveals the measured semantic target rather than the entire compact body composition; a persistent footer
remains safety-owned. Focus lifecycle is explicit, and system body compensation replaces an absolute target so field switches
cannot accumulate reveal. TEXT, PHONE_NUMBER, MULTILINE, and SEARCH are registry-owned keyboard classes. Class switches wait
for the incoming native frame instead of revealing once with the old keyboard geometry. Reel, Drawing, API/schema,
APP_VERSION, migration 22/22, dependency/native/config/EAS, and release/data boundaries are unchanged. Owner iPhone PASS is
not inferred.

Alpha.73 is the current DEV/TEST product-sketch candidate at
`ALPHA73_DIRECT_INPUT_DIDSHOW_MICRO_RECONCILIATION_IPHONE_REQA_REQUIRED`. It adds the first bounded product vertical slice:
authenticated development Draft Recipes expose freehand/Undo/Redo/Clear/explicit Save and editable reopen through the
finalized alpha.72 Scene/SVG owners. Release remains disabled `스케치(준비 중)`. Revision-owned Scene persistence has
its own optimistic version and no WorkOrder-version, R2, PDF, Viewer, Share, derivative, or export coupling. Migration
022 is DEV/TEST-only and Production migration remains zero. APP_VERSION remains `2.0.0-alpha.72`; Owner physical PASS
and alpha.73 finalization are outstanding. Alpha.73A-1 removes the unreliable Sketch header X, reuses the PDF Viewer
bottom-action pattern for large `닫기` and explicit `저장`, and keeps bottom close, Android back, and modal dismiss on one
dirty-aware close owner without implicit Save or persistence/API/schema changes.
Alpha.73A-2 preserves that UI and persistence boundary while closing the nested dirty Decision sheet before executing
the same guarded parent dismissal used by clean close, eliminating the discard-only native black-screen transition.
Alpha.73B adds the first apparel annotation set: `펜 / 선 / 화살표 / 텍스트`. It keeps line/arrow previews transient,
stores semantic WORLD endpoints/anchors only, derives arrowheads in the SVG renderer, and uses the canonical WAFL input
sheet for bounded single-line text. The Scene v1 union evolves additively with no stored-row or DB migration. Existing
freehand, explicit Save, dirty discard, independent Drawing versioning, and production isolation remain unchanged.
Alpha.73B-1 orders text entry as WORLD anchor/session → Sheet entrance completion → one session-scoped focus request.
Its crosshair and typed ghost preview are transient renderer projections of the same anchor later committed by confirm;
cancel, tool switch, and stale callbacks leave no Scene/history/network or parent-Modal effect.
Alpha.73B-2 preserves that safe focus order but removes the direct-input keyboard-show detent as an unconditional Y owner.
Mounted semantic focus geometry now yields scroll-first/minimum-rise correction, and the rise shares the native keyboard
transition duration/easing instead of starting a distinct second spring. Pre-keyboard restore, user-drag authority,
submit-before-blur, direct-input close, and nested Modal ownership remain unchanged. The Sketch transient crosshair becomes
a neutral vertical insertion caret without changing its WORLD anchor or ghost/final location.
Alpha.73B-3 corrects the physical hidden-input regression by merging a canonical minimum usable-body visibility floor and
the measured scroll-first reveal into one keyboard-frame target. Measurement failure cannot terminate at scroll-only;
`keyboardDidShow` performs one generation-guarded actual-geometry reconciliation independent of React inset equality.
This does not restore the old intrinsic-body detent or alter the accepted neutral caret and close/restore owners.
Alpha.73B-4 removes the remaining visible ordinary-resting stage only for intentional auto-focused direct-input sessions.
The mounted/layout-measured input focuses from an opt-in prepared boundary while the sheet remains offscreen; the keyboard
will-change frame supplies the first visible merged B3 target and native transition timing. Manual direct inputs and
picker/reel sheets keep ordinary opening. Final didShow reconciliation remains generation-safe, but a four-point theme-token
dead-zone suppresses a sheet rise only when body scroll has left the field visibly clear. A bounded frame-lifecycle fallback
opens to the ordinary target when focus yields no software keyboard, and that target remains keyboard-hide restore truth.
Alpha.73B-5 prepares generation-scoped sheet-local field and composition geometry before the opt-in focus request. The
first keyboard will-change callback combines that frozen geometry with the final keyboard inset and schedules one
keyboard-timed target synchronously, without starting an async window-measure/retry chain. Compact forms reveal the
coherent content/action composition in that target; long forms use actual prepared forward-scroll capacity before minimal
residual rise. Did-show actual-window measurement remains a safety assertion and a meaningful correction is classified as
a first-target miss. Lifecycle fallback, ordinary restore, drag/close ownership, and the neutral WORLD caret are unchanged.
Alpha.73B-6 retains that B5 entrance and changes only the final did-show safety pass. It classifies actual field and compact
action/footer visibility before considering raw layout delta: `CLEAR` and visible `MICRO_SETTLING` perform no sheet
animation, while `REAL_OCCLUSION` keeps bounded body-scroll-first correction and only its residual sheet rise. The shared
eight-point `spacing.sm` token characterizes the reproduced five-to-eight-point settling window; it never waives actual
clipping. Hide/close cancel queued reconciliation, and physical PASS remains owner-gated.

Alpha.72 is finalized at `ALPHA72_FINALIZATION_COMPLETE`; its accepted product checkpoint is
`ALPHA72_DRAWING_FOUNDATION_COMPLETE`. The library-independent Drawing foundation, native/runtime handset orientation
stabilization, selected SVG adapter, transient authoring path, shared freehand display smoothing, and committed render-cache
boundary are complete. Owner physical iPhone QA explicitly accepts natural curve fidelity, bounded Heavy response,
active-stroke committed layer/projection/path counters `0/0/0`, and portrait zero-twitch. APP_VERSION is
`2.0.0-alpha.72`; DEV/TEST migration remains `21/21`, Production migration is zero, and production/Owner/ambiguous
mutation is `0/0/0`. Production retains disabled `스케치(준비 중)` and alpha.73 editor work has not started.

Alpha.71 remains the previous finalized result at `ALPHA71_FINALIZATION_COMPLETE` with product checkpoint
`ALPHA71_PRE_DRAWING_COMPLETE`.
Alpha.70 remains finalized at `ALPHA70_FINALIZATION_COMPLETE` with product checkpoint `ALPHA70_COMPLETE`.

Document role: canonical owner for the current result, next candidate, and Version Delta boundary. It is not the historical implementation ledger; completed details live in numbered immutable evidence.

## Current result — 2.0.0-alpha.74

Status: `ALPHA74_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA74_COMPLETE`.

Owner physical result: `PASS`.

Alpha.74 finalizes responsive Product Sketch rectangle/ellipse authoring and the compact-tablet/native orientation
boundary over the alpha.73 Static Sheet and Drawing foundation. Owner actual iPhone and iPad-mini QA accepts portrait
continuity, zero compact native-frame motion, stable Recipe/tab/Sketch identity, touch/render alignment, mixed history,
and one explicit iPad Save/reopen of the editable WORLD Scene. Regular/Large iPad and Android physical execution remain
`NOT_RUN`; their supported policy is contract evidence only. Production keeps disabled `스케치(준비 중)`. Finalization
changes version, contracts, Git, and artifacts only; alpha.75 has not started.

## Alpha.72 current candidate — Drawing Foundation

Status: `ALPHA72_DRAWING_FOUNDATION_IPHONE_QA_REQUIRED`.

The foundation introduces one fixed `1000 × 1400` top-left logical world and a serializable versioned Scene whose ordered
freehand, line, arrow, rectangle, and ellipse elements retain stable IDs. Camera and viewport are separate transient
state; contain-fit uses one uniform scale and exact inverse world/screen transforms. A bounded immutable Scene history,
strict JSON validation, and library-independent renderer/editor/export adapter interfaces establish future extension
points without persisting viewport/device/orientation state. Drawing UI/editor/routes, gestures, derivatives, library
selection, WorkOrder/API/R2/PDF integration, schema, migration, dependencies, and business-data effects remain zero.
The disabled `스케치(준비 중)` affordance and all finalized alpha.71 behavior remain unchanged. APP_VERSION stays
`2.0.0-alpha.71`; physical iPhone regression PASS is not inferred.

### Alpha.72A-1 native orientation stabilization

Status: `ALPHA72_DRAWING_FOUNDATION_NATIVE_ORIENTATION_STABILIZATION_IPHONE_ANDROID_QA_REQUIRED`.

Owner physical evidence found one visible first-rotation twitch even though the alpha.71 runtime lock ultimately returned
the iPhone to portrait. The accepted architecture therefore has two agreeing layers. A local Expo config plugin owns the
earliest generated native policy: `UISupportedInterfaceOrientations` is portrait-only for iPhone, the iPad-specific key
retains portrait/upside-down/left/right support, and Android MainActivity reads native
`configuration.smallestScreenWidthDp` before `super.onCreate(null)`, requesting portrait only below 600dp. Android's
manifest remains `unspecified`, so tablets are not globally locked. The existing SDK55 `expo-screen-orientation` owner
remains the mount/foreground safety net: handset locks `PORTRAIT_UP`, tablet unlocks to default. The global Expo
orientation remains `default`; Recipe/WorkOrder/Drawing are not policy inputs. Drawing Foundation source hashes and all
Media behavior remain unchanged. New internal development binaries are required before physical judgment; iPhone and
Android phone physical PASS are not inferred.

### Alpha.72B Drawing renderer PoC comparison

Status: `ALPHA72_DRAWING_RENDERER_POC_ENTRY_GATE_IPHONE_REQA_REQUIRED`.

Owner iPhone orientation evidence is PASS (`고정된다`). An authenticated Recipe session in a development bundle turns the existing
Sketch affordance into the comparison entry; neither System Admin nor `[SIM]` identity is required. Production and release continue to expose disabled
`스케치(준비 중)`. SVG and Skia adapters consume the same immutable Scene, shared renderer-neutral projection, camera,
viewport transform, and built-in PanResponder `screenToWorld()` path. The toggle retains exact Scene serialization;
Sparse/Medium/Heavy workloads use deterministic 5/80/240 elements and 8/800/4800 freehand points. Clear/Undo/Redo and
live freehand are in-memory only. The only dependency/native delta is `@shopify/react-native-skia`; no gesture,
reanimated, worklets, API, schema, migration, persistence, R2, PDF, export, or product-data change is authorized. The
static Skia adapter bypasses the package-root barrel that eagerly evaluates optional Video/Reanimated exports. Renderer
recommendation remains `RECOMMENDATION_PENDING_OWNER_PHYSICAL_POC`, and renderer physical PASS is not inferred.
The unchanged existing EAS project/profile produced internal Development Builds
`71a3b621-31e9-493d-ac04-2888f0337abf` (iOS, 26,154,478 bytes) and
`a2416e06-2ca0-431a-b575-67dafc29e871` (Android, 282,775,915 bytes). These builds make the native Skia comparison
installable but do not select a renderer.

### Alpha.72C SVG renderer selection and authoring pipeline optimization

Status: `ALPHA72_SVG_RENDERER_AUTHORING_PIPELINE_OPTIMIZATION_IPHONE_QA_REQUIRED`.

Owner physical comparison is authoritative: SVG and Skia were broadly similar, SVG felt marginally faster at Medium, and
Skia showed no clear Heavy advantage. `DRAWING_RENDERER_SELECTED_SVG` therefore selects existing `react-native-svg`; the
temporary `@shopify/react-native-skia` package/lock entries, adapter, static reconciler workaround, renderer toggle, and
comparison-only contract are removed. The framework-free renderer adapter boundary remains available for a future evidence-led
swap. The currently installed comparison Development Build may retain an unused Skia native module; no rebuild is required when
the current JS bundle imports none.

The shared authoring pipeline separates committed `DrawingSceneV1` from one transient world-coordinate active stroke. Pointer
move updates only the transient stroke and performs committed Scene mutation, serialization, and history mutation `0/0/0`.
The committed projected frame is memoized by Scene identity and viewport transform; the active path alone is reprojected.
Pointer release preserves the final sample and performs one Scene commit plus one history commit. The conservative sampling
threshold remains `1.5` logical world units, independent of device pixels; pointer cancel commits nothing. Sparse/Medium/Heavy,
all five element kinds, uniform scale, world `1000 × 1400`, undo/redo, and the authenticated DEV entry remain. Production
`스케치(준비 중)`, persistence, WorkOrder/API/R2/PDF/export, schema, migration, and business data remain unchanged.
Performance and curve quality physical PASS are not inferred.

### Alpha.72C-1 freehand fidelity and Heavy render optimization

Status: `ALPHA72_FREEHAND_FIDELITY_HEAVY_RENDER_OPTIMIZATION_IPHONE_QA_REQUIRED`.

The accepted transient authoring architecture remains intact. Owner counters show that the physical jagged stroke accepted
every sample (`73/73`, decimated `0`), so the root is the SVG straight-line display path rather than the `1.5` world-unit
sampling threshold. Raw Scene points remain canonical and unchanged. One shared dependency-free
`midpoint-quadratic-v1` builder derives active and committed display paths, preserves endpoints, inserts no new points, and
keeps world geometry invariant across viewports. Average and maximum accepted world-point gaps are exposed as diagnostics.

Committed and active SVG layers are separate memoized subtrees. During one active stroke, the committed frame, paths, and
layer remain reusable; pointer movement rebuilds only the active path. Pointer release still commits Scene/history exactly
once. Heavy remains 240 elements/4800 freehand points. This Delta adds no dependency, native/EAS change, persistence,
schema, migration, WorkOrder/R2/PDF integration, or production Sketch activation. Physical curve fidelity and Heavy response
remain Owner iPhone judgments.

## Alpha.71A current candidate — pre-Drawing architecture only

Status: `ALPHA71_PRE_DRAWING_ARCHITECTURE_REFACTOR_IPHONE_QA_REQUIRED`.

This candidate is deliberately behavior-zero. Overview receives one typed Media boundary rather than a flat
image/attachment prop family. The compatibility authoring controller composes separate image, attachment, and
shared projection/version owners while retaining one mutation gate and the full alpha.70 upload, expectedVersion,
reconcile, representative, inclusion, deletion, attachment, and re-entry contracts. Image and attachment APIs are
separate implementation modules behind the existing facade. The future Drawing architecture contract forbids
device-sized persisted geometry and requires a fixed logical world, inverse input transforms, viewport-only
zoom/pan/orientation, editable Scene truth, deterministic derivatives, and adapter-only media export. The current
disabled `스케치(준비 중)` affordance is unchanged. Physical result: `PHYSICAL_RESULT_NOT_INFERRED`.

### Alpha.71A-1 mobile orientation continuation

Status: `ALPHA71_PRE_DRAWING_REFACTOR_ORIENTATION_POLICY_IPHONE_QA_REQUIRED`.

The installed Expo Router/native-stack and react-native-screens path was initially selected without a new native module.
One framework-free mobile orientation policy classifies iOS from `Platform.isPad`; Android alone falls back to the
physical screen's shorter side at 600dp. Width/height swaps therefore preserve classification. Root Stack receives
`portrait_up` for handsets and `default` for tablets/web. `apps/mobile/app.json` remains globally `default` with
`ios.supportsTablet: true`. WorkOrder, Media, image/spec, future Drawing coordinates, PDF, Viewer, Share, dependencies,
native source, and EAS are unchanged. Tablet physical QA is `NOT_RUN` unless hardware is available; source/type/config
contracts proved the intended tablet rotation policy but did not prove physical enforcement. Owner physical iPhone QA
later recorded both handset orientation checks as `FAIL`; the root `screenOptions` mechanism is not accepted as effective.

### Alpha.71A-2 physical orientation-lock correction

Status: `ALPHA71_PRE_DRAWING_PHYSICAL_ORIENTATION_LOCK_CORRECTION_IPHONE_REQA_REQUIRED`.

Live Expo Router and React Navigation sources show root `screenOptions` and explicit `Stack.Screen options` merging into
the same route descriptor and native-stack view, so merely spelling the option on `index` would preserve the failed
mechanism. The correction installs the official SDK55-compatible `expo-screen-orientation` module and owns it only at
the root app/navigation boundary. The existing pure device classifier resolves a runtime action: handset locks
`PORTRAIT_UP`, tablet unlocks to the app's global `default`, and web/other is untouched. Initial mount and each genuine
background/inactive-to-active transition reconcile through one serialized, coalescing owner; render, WorkOrder state,
Recipe state, and Media state do not trigger native calls. Internal `development` build
`8d201f5b…978c` now establishes a binary containing the new native module on the existing EAS
project/profile; registered-iPhone installation and owner physical orientation judgment remain outstanding. Drawing
remains unimplemented and `스케치(준비 중)` remains unchanged. Physical result: `PHYSICAL_RESULT_NOT_INFERRED`.

## Previous result — 2.0.0-alpha.67

Status: `ALPHA67_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA67_REORDER_PDF_BRANDED_SHARE_COMPLETE`.

Alpha.67 completes the Nth Reorder E2E and its bounded physical-QA remediations without adding
Rework creation or alpha.68 workflows. The server remains authoritative for lineage, global round,
copy/reset policy, issue/readiness and document identity. Mobile uses the returned WorkOrder ID for
post-create hydration and retains one canonical list/detail status owner. Issued PDF generation,
generation-only retry, private asset integrity, in-app viewing, Save, and one branded public Viewer
share URL retain their security boundaries. The final narrow cost correction derives estimated
per-piece cost from existing canonical totals without altering component costs or persistence.

APP_VERSION is `2.0.0-alpha.67`. DEV/TEST migration ledger is `20/20`; new migration,
production mutation and owner-fixture mutation are zero. Final Git and artifact identity are owned
by the matching post-push repo-state.

## Previous result — 2.0.0-alpha.68

Status: `ALPHA68_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA68_COMPLETE`.

Owner physical result: `PASS`.

Draft fields now remain local after editing and flush only at tab/WorkOrder navigation, detail exit,
app inactive/background best-effort, or immediately before a business command. The 1.2-second idle
timer is not a persistence boundary. New Material and Production rows use temporary client identities;
boundary flush creates or updates them atomically enough for the existing section contract, reconciles
server identities, and only then runs lifecycle commands exactly once. Images and attachments retain
their immediate object-store semantics.

The current WorkOrder category and item code now own WAFL basic-spec recommendation and apply compatibility; empty or stale spec metadata cannot hide or cross-route T/B/O/D defaults. Reorder Draft deletion retains exact hard delete and a durable non-navigable deleted-round event, using the event table's canonical text identity. Binary Maker decisions use a two-row `WAFL INPUT` reel with safe default and one V, while ordinary editor sheets keep X/V. Transient result notices use one centered buttonless alert with a 1.2-second default; loading remains explicitly command-owned.

The candidate replaces Draft keystroke/cell persistence with local-first dirty generations and
bounded serialized section flushes, including one atomic Size/Color quantity batch. List rows expose
confirmed swipe actions without full-swipe mutation. Copy is an idempotent server command producing
an independent original Draft; Reorder keeps the existing server-assigned series round and accepts
only production-variable edits. Confirmation flushes all Draft state before the canonical readiness
and issue owners. Draft PDF Preview is authenticated and ephemeral; confirmed Download/Print/Share
retain private transport, with one 72-hour branded Viewer policy. Confirmed due date and Basic Process
memo are the sole post-confirm mutable values and refresh the existing generated-document identity.
The Owner explicitly accepted the accumulated alpha.68 physical iPhone boundary after the final
close-animation ownership correction. APP_VERSION is `2.0.0-alpha.68`. Dependency, native, EAS,
schema, and migration additions are zero; production, Owner, and ambiguous data mutations are zero.
The remaining post-alpha.68 backlog includes PDF first-page image balance/readability, `.waflspec`,
drawing/sketch, organization/account/permission,
production partner/contact management, universal credit billing, and service/pilot readiness.

## Alpha.69 implementation boundary (finalized)

Status: `ALPHA69_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA69_COMPLETE`.

Owner physical result: `PASS`.

The first alpha.69 delta adds guidance-only category/detail recommendations. Denim recommends waist labels
24–36, leggings XS–XL, and the remaining authored apparel details use their declared alpha-size sets. The
Size chooser retains all other WAFL, company, direct, and unmatched current choices. The POM chooser uses the
same shared policy order for its recommended section and keeps the rest of the category catalog separate.
Changing detail recomputes presentation only. Detail-aware WAFL templates use that same POM policy and only
existing seed values; 24–36 values are deliberately blank/editable. Schema, migration, dependency, native,
EAS, and production/Owner data deltas are zero. Physical iPhone acceptance remains required.

The current focused delta applies the Owner-authored V0.1 values to all seven target-major starter identities and
narrows male-bottom primary guidance to 28/30/32/34/36/FREE while retaining 24/26 in the disclosed system universe.
Only current WorkOrder Size rows receive matching values, and all projected cells remain editable. Target/major
dependent reset and real-loss Size/Color replacement replace the active WAFL INPUT body with the shared
question/helper/two-row reel/V destructive-choice state without a second React Native Modal; cancellation mutates
nothing and confirmation reuses the existing exactly-once owner. A WAFL recommended-spec apply alone presents the
shared `스펙 정보를 불러오는 중입니다.` processing blocker before content fetch and mutation begin.

## Previous result — 2.0.0-alpha.66

Status: `ALPHA66_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA66_WORKORDER_LINEAGE_SAMPLE_FILTER_PREISSUE_COMPLETE`.

Alpha.66 adds an additive DEV/TEST-only WorkOrder identity foundation: Sample is a display/character flag, `original / reorder / rework` is derivation lineage, the existing lifecycle is workflow status, and R0/R1/R2 remains document revision. These axes never collapse into one enum. Migration `019` preserves all existing rows as non-Sample original round zero and adds tenant-safe source/root/revision references plus server-list indexes. Additive migration `020` enforces the owner invariant that Sample can be original or round-zero Rework but can never be direct Reorder or carry inherited reorder-round context. The approved DEV/TEST ledger is `20/20`, while production migration/mutation and owner-fixture mutation are zero.

Fresh normal WorkOrder creation defaults Sample ON in the mobile UI and permits opt-out. Omitted API input has an explicit false default, and the WorkOrder-level Sample flag may change without revision or PDF rewrite only on round-zero original/Rework rows. Reorder-context detail hides the invalid Sample switch. Detail now anchors the compact character control at hero top-right, moves workflow status below the representative image, removes only its duplicate informational Sample pill, and retains Reorder/Rework lineage pills. The synthetic family contains production original, Sample original, production Reorders, production Reworks including inherited reorder context, and Sample Rework—never Sample+Reorder. Overview reuses one canonical readiness array for the exact compact issue count and complete `발행 전 확인` WAFL Sheet. Mutation-driven entity-version changes invalidate stale readiness and reconcile the canonical detail projection; no local counter patches N. Stable issue codes, never Korean message parsing, route actionable rows to current WorkOrder tabs; unknown issues remain visible, and zero issues show `발행 준비 완료`. Reorder creation/copy, Rework creation/reason E2E, and source navigation remain alpha.67/alpha.68 scope.

APP_VERSION is `2.0.0-alpha.66`. The owner approved this bounded alpha.66 scope for finalization
under `OWNER_ACCEPTED_ALPHA66_SCOPE_FOR_FINALIZATION`. Actual Reorder and Rework creation E2E
remain `0/0`; alpha.67 implementation has not started. Final synchronized Git and artifact facts
are owned by the matching post-push repo-state.

## Current result — 2.0.0-alpha.65

Status: `ALPHA65_FINALIZATION_COMPLETE`.

Alpha.65 finalizes the cumulative Maker input, Production authoring and Finished Spec visual
candidate on the alpha.64 document foundation. The accepted product checkpoint is
`ALPHA65_MAKER_INPUT_FINISHED_SPEC_VISUAL_COMPLETE`: shared draggable/free-settle WAFL INPUT
and PICK behavior, reusable direct-create parity, WorkOrder Size as Finished Spec Size SOT,
cm and exact 1/8-inch input, Production process authoring, Address Search, eight authored
T/B/O/D front/back static technical-flat views, focused preview cardinality `0..1`, and
`55/55` stable side routing are preserved. Migration ledger remains `18/18`; migration `019`,
production mutation, and owner-fixture mutation are zero.

Owner release acceptance is exactly
`OWNER_RELEASE_ACCEPTED_WITH_PROVISIONAL_GARMENT_ASSETS`. The current eight views are release
assets for alpha.65, not the final aesthetic target. A future designer-authored eight-SVG
replacement is `DESIGNER_AUTHORED_GARMENT_SVG_REPLACEMENT_DEFERRED` and must preserve the
current renderer, focused-preview, routing, grid and X/V architecture.

The detailed paragraphs below preserve alpha.64 and alpha.65 implementation checkpoints. Their
interim re-QA labels and pre-finalization version boundaries are historical facts and do not
override the final result above.

Alpha.64 finalizes the cumulative Maker mobile release candidate after owner physical-iPhone
approval. The accepted boundary includes the six-tab Maker IA, Design System v2, one shared
input/sheet architecture, WorkOrder Size/Color and Finished Spec authoring, saved specs,
Fabric/Accessory lifecycle, in-app Juso search, session-local Quick Delivery, and Maker R0
document issue/PDF/R2/Viewer/share/managed-QR behavior. The verified editable table geometry is
the stable `82×44` cell with a centered `60×34` value surface, `11/11` horizontal breathing
room, a `5`-point bottom-grid gap, one hairline, and zero focus geometry shift. Migration ledger
`18/18` is preserved; migration `019`, production mutation, and owner-fixture mutation are zero.

The current alpha.64 stabilization keeps `11a-mobile-design-system-v2.md` and `11b-maker-workorder-tab-ia-v2.md` as the mobile visual/IA owners. It extends the existing same-company structure catalog with reusable spec items, adds one WorkOrder POM-selection batch command, and makes only the WorkOrder feature rail sticky. The physical-iPhone remediation replaces the insufficient source-only sheet PASS with a mounted 44-point header responder, continuous translation, medium/expanded/dismiss snaps, and bottom-origin enter/exit motion while keeping fixed X/V actions. Finished Spec now offers category-specific practical `WAFL 제공` sets plus tenant/category-scoped `우리 회사` options; null/category changes preserve current rows until explicit V. WorkOrder and saved-template POM rows remain historical snapshots; catalog management does not rewrite them. Existing cumulative Maker capability, projections, Juso search, local-only Quick Delivery boundary, and R0 document lifecycle remain unchanged. Migration `017` remains the spec-item kind extension and additive dev/test-only migration `018` adds nullable category scope without backfill; production mutation is zero and APP_VERSION remains alpha.63 until owner physical QA.

The latest focused candidate preserves that shared sheet architecture while removing dead child V actions, using one nested close/unmount/reopen handoff for reusable catalog creation, and auto-staging successful Size/Color/Spec options for the parent batch. Saved Spec load/save use measured `adaptiveExpandable`; the numeric(14,3) material precision is owned once across DB-facing validation and mobile direct input; keyboard-safe focus reveal and keypad mode-switch reachability stay in the common body owner. Quick direct entry is address-first and remains local-only. No migration `019`, version bump, commit, release, fixture mutation, or production mutation is part of this pre-owner-QA boundary.

The current focus/nested stability candidate measures a complete semantic field block through the shared sheet owner, scrolls that block before applying only the minimum required free-height expansion, and keeps Fabric/Accessory on one paired editor path. Quick origin/destination partner, direct entry, and Juso search share one generation-aware close/reset/presentation coordinator; select and cancel use identical native-sheet sequencing, while endpoint-scoped focus runs only after the matching returned direct sheet mounts. Physical iPhone re-QA remains required, APP_VERSION stays alpha.63, and migration/schema/fixture/production effects remain zero.

The latest focused Quick candidate brings the request-preview child into that same nested coordinator. Its adaptive measurement identity includes the presentation generation, and the shared Sheet entrance can no longer lose its queued slide-up when current-generation layout changes before the first frame. Direct endpoints reopen their prefilled direct editor immediately, while registered or unspecified endpoints keep the picker route through one pure origin/destination policy. Quick remains session-local with no persistence, schema, Event, Receipt, or production effect.

The current WorkOrder-create/table-input candidate removes the last live text-entry form that used fixed `contentFit` and raw mount-time `autoFocus`. Creation now opens through the shared compact `adaptiveExpandable` policy and asks the product-name field to focus only after the current atomic entrance is presentation-ready; X remains cancel and V remains the one create command. The live Finished Spec inch surface is retained as the shared numeric-table baseline and is the same geometry owner used by cm and Size/Color quantity, with focus limited to tint/color and zero grid shift. This pre-owner-QA boundary adds no migration, schema/API expansion, fixture write, version bump, commit, release, or production effect.

The current Finished Spec bootstrap candidate preserves the physically accepted `82×44` cell and centered `60×34` editable surface unchanged. An editable draft now exposes the existing `스펙 항목 〉` chooser even when the projection has zero POM rows and when major category is null. Category determines recommendation contents rather than authoring availability; category-neutral company options reuse migration `018`'s existing nullable scope, and the canonical `set-pom-selection` transaction bootstraps the absent measurement snapshot and Size-aligned projection on the first explicit V. Valid zero-row state remains a normal read model and technical measurement repository errors are mapped to product-safe messages. Issued/locked behavior, schema ledger `18/18`, production mutation zero, and pre-finalization version/Git boundaries remain unchanged.

The latest owner physical result overrides that automated sheet claim: the movement-threshold PanResponder returned false at touch-down and relied on later capture after native descendants could own the gesture. The canonical sheet header now captures the native responder immediately, follows touch `pageY`, and preserves slide-in/snap/slide-out motion. Central `contentFit` / `expandable` / `fullView` sizing removes large short-content gaps without losing scroll or fixed-footer semantics. Overview total quantity shares the exact inner ValueSurface component tree, `제작` is restored from the existing tenant-scoped process Read owner, and all six tab bodies share one top inset. `ProductionCardMock` remains Runtime-unused. This is a physical iPhone re-QA checkpoint, not a physical gesture PASS.

The current owner IA simplification variant keeps that canonical system and adds shared metric affordance, matrix/spec presentation, section-header actions, and a presentation-only combined Materials tab. Overview metrics share one surface while editable child controls alone provide one thin underline. Size/Color now opens on the real Color × Size matrix with compact header actions, and Finished Spec is also expanded. The visible Maker rail is `개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`; historical material tab intents map safely to that combined presentation. These changes are marked `OWNER_PHYSICAL_REVIEW_REQUIRED`; domain entities, business behavior, and the alpha.64 effect boundary are unchanged.

The latest owner refinement removes the duplicate metric underline, introduces one shared frozen-axis table for Color × Size and Finished Spec, and bases `전체보기` only on the left-axis row count: Color or POM rows six and above. Size columns remain horizontally available while the left label stays fixed; full view freezes both headers and synchronizes x/y scrolling. The combined Materials screen now uses a same-page Fabric/Accessory category switch with typed semantic count badges and one selected-category add action. Only the selected normal list renders, and the former four-card presentation clipping is removed. This remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; Size/Color and material business owners are unchanged.

The current focused footer remediation preserves the owner-confirmed physical sheet drag, slide motion, shared tab-body inset, and Quick direct-address child routing. The first-open action fix had inverse-translated the X/V footer against the whole-sheet detent while the body retained the expanded viewport, so the visible footer floated over lower controls. `WaflInputSheet` now owns a real ordered `HEADER / BODY VIEWPORT / FOOTER / SAFE AREA` frame: the body viewport contracts by the live detent offset, the measured footer remains a normal sibling, and long content alone scrolls. Short Saved Spec save/update uses measured `contentFit` rather than the expandable medium floor. This is an owner physical-iPhone re-QA checkpoint; automation does not infer visual or gesture acceptance.

The shared-sheet stability remediation confirms one canonical staged-sheet module rather than feature-local bottom sheets. `WaflInputSheet` owns geometry, drag/detents, lifecycle, vertical extent, keyboard inset, safe area, and X/V. The former outer `KeyboardAvoidingView` shifted the entire expanded sheet, while a stale native animation value could seed the first drag after reopen. Keyboard handling now reserves an internal bottom inset and shrinks only the body; each open generation cancels stale animation and acquires the actual stopped visual offset before MOVE. The shared body-end gap restores true-bottom reachability for long Color, material, Quick, address, Spec, and attachment bodies. Physical re-QA remains mandatory.

Alpha.64 completes only the first Maker R0 document path on the existing immutable Revision/PDF/R2/controlled-Viewer foundation: one canonical server issue-readiness policy, issuance-time material supplier snapshots, selected image-attachment output, immediate post-issue generation with typed failure retry, the real mobile `문서` workbench, manual 1/7/30-day sharing, and explicitly revocable managed embedded QR access. The current owner-QA runtime is also corrected from a document-only island to one cumulative Maker capability profile shared by internal command guards and the exact Tailscale method/path gate. The mobile tab follows the established ProductionCard document-workbench grammar using real data, with practical production information, compact output actions, and an explicit irreversible `작업지시서 생성` confirmation rather than redundant document framing or permanent ready copy. Historical mock/showroom sources remain visual evidence only and are not connected to normal Runtime. R1 correction, Factory/AI expansion, delivery-request behavior, PDF attachment merging, successful-PDF regeneration, and generated-document deletion remain deferred. Migration `016` is additive dev/test-only; production mutation is zero. APP_VERSION remains alpha.63 until owner physical-iPhone QA and a separate finalization.

The latest owner-approved UI refinement removes pre-generation document-system metadata and
optional-content badge clouds, presents the actual product image/name, due date, quantity,
active fabric/accessory counts, factory placeholder, and factory-delivery memo in the same
live WAFL mobile grammar, and uses `작업지시서 생성` as the normal action. The current v2
model has no persisted production-category owner equivalent to legacy `workOrderKind` /
`orderType` / `reorderRound`, so that row remains deferred without a migration or inferred
mapping. The latest owner-approved remediation exposes the truthful non-interactive
`생산 구분 · 미지정` position without persistence. It also extends `output_include` as the
single issuance-time selection owner for two distinct outputs: supported images may render
inside the main PDF, while every selected attachment is frozen in the immutable snapshot and
served through the same controlled Viewer/session as a delivery bundle. Raw object keys and
signed URLs remain server-only.

The same remediation adds a bounded Quick Delivery UI foundation from real `requested`
fabric/accessory rows grouped by their actual supplier. Origin, factory-capability destination,
driver, and memo changes are local staging only, and the action produces a read-only preview.
`QUICK_DELIVERY_PERSISTENCE_DEFERRED` and `PRODUCTION_CATEGORY_V2_POLICY_DEFERRED` are explicit;
no delivery row, PDF, event, receipt, token, object, or migration `017` is created.

The current bounded remediation extends the canonical single-choice WAFL reel with an explicit
nullable contract: only callers that opt in receive `미지정` as the first item, while required
pickers retain their existing behavior. Quick Delivery opt-in pickers order that nullable item
before registered partners/factories; `직접 입력` is no longer a list value. Picker mode uses
`직접 입력으로 변경`, and direct mode uses `WAFL PICK으로 변경` from the shared input-mode
owner. The child direct editor preserves
the parent staged session across X/reopen and applies only to local preview state on V. Address
search now remains inside a native WAFL sheet and calls the official Juso Search API only through
an authenticated, no-store Next proxy. The existing `JUSO_API_KEY` is server-only; mobile receives
only bounded normalized fields, ignores stale responses, supports first-page/more paging, and
returns to the preserved direct-input draft for detail-address entry. The rejected Kakao script,
system-browser route, and address-specific deep-link callback are removed. No WebView, native
dependency, EAS input, backend delivery persistence, or schema is added.

The document quantity disclosure remains collapsed by default, shows at most the first six
non-zero cells in canonical Color/Size display order, and opens a separate read-only full-list
sheet when more values exist. This avoids an unbounded nested main-tab scroll without changing
the matrix projection or owner fixture.

The current UI remediation extracts the live image/attachment icon-and-short-label action tile
as one visual-only owner and reuses it for Size, Color, fabric/accessory add, document attachment,
and Quick Delivery. Business behavior, authorization, lifecycle, and mutation ownership do not
move. The document production overview and selected attachments form one visual container with
a weak divider, and attachment/Quick actions are not a nested tab bar. Quick preview displays the
staged place name or address for direct locations instead of exposing the mode name.

## Next boundaries after alpha.64

1. Alpha.65 candidate: bounded draft authoring for one Production factory plus zero-to-many additional processes on the existing schema. Options reuse current standards/partner owners, process quantity is a server-owned projection of WorkOrder total, and all costs remain transactionally synchronized. The checkpoint remains owner physical-iPhone QA; APP_VERSION, commit, push, and release remain unchanged until separate finalization.
   The memo-ownership continuation removes the active Image/Attachment editor for the historical revision-scoped factory-delivery memo without deleting or migrating its stored values or changing existing document/PDF consumers. Factory and additional-process rows share the same optional multiline field backed by `work_order_processes.memo`; unrelated edits and total synchronization preserve it, nullable clear uses the existing null contract, and deleting the row removes its memo. The latest Production presentation candidate keeps that ownership and replaces normal multi-field forms with card + inline editing: factory/process/eligible partner use WAFL PICK, unit price and memo use `ControlledInlineEditValue`, and the shared WorkOrder tab body owns both horizontal edges. Derived expected cost is hidden only in Production authoring while server amount/totals stay canonical. The checkpoint is `ALPHA65_PRODUCTION_CARD_INLINE_UI_IPHONE_REQA_REQUIRED`; migration `019`, production mutation, owner-fixture mutation, version bump, commit, push, and release remain zero.

   The subsequent material-style lifecycle refinement consolidates Production under one shared category-switch/card family without merging Material and Production domains. Basic Production reuses the existing process status for request/cancel/complete lifecycle; Additional Process has no order action. Integer-won unit labor cost, counted 100-character memo, first-real eligible-partner staging, and zero-result-safe PICK are permanent alpha.65 rules. The retained isolated QA returns Basic to editable `ready` after request/cancel and preserves three useful process rows for owner review; terminal completion is deferred to physical QA. The checkpoint is `ALPHA65_PRODUCTION_MATERIAL_STYLE_LIFECYCLE_IPHONE_REQA_REQUIRED`; APP_VERSION stays `2.0.0-alpha.64`, ledger stays `18/18`, and migration `019`, production mutation, owner-fixture mutation, version bump, commit, push, and release remain zero.
   The physical-parity continuation promotes compact selection/value fields, action rows, and the one-line quantity/amount summary to shared Material/Production presentation owners. Serialized Production edits now reconcile the current process projection and persisted identity before each command; the retained isolated fixture proved Basic/Additional price and memo saves, rapid sequential edits, request/cancel followed by save, and factory delete/recreate followed by new-ID save with 35 HTTP 200 responses and zero 404. All Production PICK routes now use one active canonical reel-sheet invocation, required partner selection stages its first real option before presentation, new-process `미지정` remains a non-persisted sentinel, and memo staging enforces the server-owned 100-character ceiling. The physical save alert was caused by an alpha.64 external capability profile serving alpha.65 source, so the required QA Runtime is `alpha65-current-maker`. The checkpoint is `ALPHA65_PRODUCTION_PHYSICAL_PARITY_SAVE_PICKER_IPHONE_REQA_REQUIRED`; actual iPhone drag parity is not inferred from contracts, and all finalization/migration/production boundaries remain unchanged.
   The common-picker continuation remediates the one shared mounted drag boundary used by Target, Major Category, Unit, Factory, Process, and Partner. Gesture readiness and the visual drag base are now synchronous at responder grant, preventing native iOS from delivering and losing the first MOVE while an animation-stop callback is pending. Required-choice open state also treats an invalid current candidate as absent and stages the first real candidate atomically; nullable choices, the new-Process `미지정` exception, and empty lists retain their existing rules. The checkpoint is `ALPHA65_COMMON_PICKER_PHYSICAL_DRAG_IPHONE_REQA_REQUIRED`; physical success remains owner-iPhone gated and no finalization boundary changes.
   The common-UI consistency continuation makes required Partner staging independent of whether the caller is creating or editing a process row: one or many eligible options with no valid current value stage the first real option atomically, while the new-Process `미지정`, nullable pickers, and zero-result path remain unchanged. Live single-line inline fields now share focus-neutral geometry, the six Maker tabs use one cached-content/uncached-loader/genuine-error grammar, and bounded Overview/Image/date microcopy is aligned. The checkpoint is `ALPHA65_COMMON_UI_CONSISTENCY_IPHONE_REQA_REQUIRED`; physical iPhone review and all finalization boundaries remain unchanged.
   The sheet-inventory continuation makes every live mobile sheet an explicit draggable, fixed, or interaction-specific route. Address Search joins the canonical draggable/free-settle family with presentation-ready focus; Size, Color, and Spec direct creation share one field/action shell; and source fields keep identical geometry while a child PICK/INPUT is open. The checkpoint is `ALPHA65_SHEET_INVENTORY_REUSABLE_CREATE_ACTIVE_GEOMETRY_IPHONE_REQA_REQUIRED`; physical drag and visual parity remain owner-iPhone gated, with no migration, production/owner-fixture mutation, version bump, commit, push, or release.
   The direct-create parity continuation makes one shared parent `+ 직접 만들기` action responsible for Size, Color, and Spec entry geometry and states, while their children retain one shared full-width `추가` action. Size and Color direct-create content bypasses the selection-list-only outer inset so the child action slot is identical to Spec without changing palette, catalog, staging, or mutation behavior. The checkpoint is `ALPHA65_DIRECT_CREATE_CTA_ACTION_PARITY_IPHONE_REQA_REQUIRED`; physical iPhone acceptance and every finalization boundary remain unchanged.
   The visual-spec continuation replaces the Finished Spec chooser's long rows with one feedback-only technical garment diagram and a shared four-column staged grid. Upper, lower, outer, and dress map the complete current WAFL-provided catalogs by stable system identity; company/custom/current entries remain selectable and manageable, while Other and legacy Setup use grid-only fallback. Setup is omitted only from new Overview authoring choices; persisted setup WorkOrders and measurements remain readable and are never migrated or remapped. The first generic connector layout was rejected by owner physical iPhone review because intersecting diagonals obscured garment identity. The fidelity continuation keeps one renderer but makes all 55 measurement/connector/label paths explicitly hand-authored per category, removes fallback connector generation, quiets inactive guides, and bounds the diagram footprint. The checkpoint is `ALPHA65_VISUAL_SPEC_DIAGRAM_FIDELITY_IPHONE_REQA_REQUIRED`; physical visual acceptance and all finalization, migration, production/owner-data, and delivery boundaries remain unchanged.
2. Integrate the Sketch/drawing API only after the Production boundary is separately approved.

Deferred product policy (`POST-alpha.64`): changing or clearing a WorkOrder major category
never auto-deletes Finished Spec rows or measurement values and never silently remaps them to
the new category. The category only changes future recommendation/default-catalog scope. A
future non-destructive informational warning may say
`대분류가 변경되었습니다. 기존 완성 스펙 항목과 치수를 확인해주세요.`; it is not a
confirmation gate and must not reset operational data.

## Previous result — 2.0.0-alpha.63

Status: `ALPHA63_FINALIZATION_COMPLETE`.

Alpha.63 completes source/architecture-only stabilization of the accepted alpha.62 Maker
mobile product:

- `MobileWorkOrderExperience` retains top-level composition, session/list/create/navigation,
  and overview coordination while coherent controllers own paired material/accessory,
  image/attachment, and size/spec feature lifecycles;
- typed session, WorkOrder, material, size/color, measurement, and asset API modules sit above
  the single canonical `apiTransport` request/auth/error owner;
- `mobileContract.ts` remains intentionally shared, and the new controller/API import graph
  has circular dependency count `0`;
- current shared inline, queue, pending, projection, picker, Sheet, copy, date, placeholder,
  and display owners are reused without user-visible feature or UX change;
- material Runtime measurement preserves one detail plus one lifecycle-filtered material-list
  revalidation read where the command response is not authoritative for every projection;
- targeted and historical contracts, TypeScript, ESLint, Next/Expo builds, isolated Runtime,
  mutation audit, Node 24.14.0 Canonical Verify, DeveloperAutoConnect, and owner physical-iPhone
  regression passed with no production, schema/migration, dependency/native/EAS, Factory,
  PDF/document, or AI expansion.

Evidence: `63-mobile-architecture-stabilization-evidence.md`.

## Previous result — 2.0.0-alpha.62

Status: `ALPHA62_FINALIZATION_COMPLETE`.

Alpha.62 completes the bounded size-measurement standards/template and Maker authoring
workflows on the accepted alpha.61 architecture:

- additive dev/test migrations `014` and `015` own versioned system/company size-spec
  templates, independent revision snapshots, cm/inch plus exact 1/8-inch persistence, and
  same-company reusable size/color options; production migration and mutation remain zero;
- WorkOrder Size is the finished-spec size source of truth, while WAFL recommendations and
  user-saved specs copy only matching values into the current independent snapshot;
- canonical shared mobile owners cover reels, V/X sheets, semantic choices, option grids,
  nullable normalization, immediate focus, serialized mutations, command-scoped pending,
  staged size/color batch selection, projection promotion, and paired material copy;
- measurement/template commands reconcile only their declared projection impact, preserving
  zero whole-tab reload for set-cell/unit and template save/update, and at most one targeted
  spec read for template apply;
- alpha.60 draft-child hard delete, linked quantity cleanup, matrix-total synchronization,
  replay, and requested/completed/issued/legacy protection remain intact;
- targeted/static checks, isolated Runtime suites, Canonical Verify, DeveloperAutoConnect,
  and owner physical-iPhone final QA passed. Finalization preserved the owner fixture and
  changed no production, R2, PDF, token, dependency, native, or EAS boundary.

Evidence: `62-size-measurement-standards-templates-evidence.md`.

## Previous result — 2.0.0-alpha.61

Status: `ALPHA61_FINALIZATION_COMPLETE`.

Alpha.61 completes the bounded mobile WorkOrder-create flow and DeveloperAutoConnect finalization:

- draft creation uses the canonical tenant, member, permission, expected-version, idempotency, Event, and Receipt command boundaries;
- the mobile create sheet, list insertion, shared policy, and API client reuse the alpha.53 architecture rather than creating a parallel product path;
- owner physical-iPhone product QA passed creation, size `L`, color `네이비`, `네이비 × L = 100`, detail/list persistence, background/re-entry, and one Development Client Reload;
- DeveloperAutoConnect dynamically resolves the current Tailscale IPv4. The owner then closed and reopened the Development Build, entered WAFL automatically without a manual URL, and confirmed that no `192.168.*:8081` address was selected;
- the exact dev/test owner QA draft was cleaned once with mutable residual zero while Event/Receipt evidence was preserved and Receipt references were detached using the canonical composite identity.

Evidence: `61-mobile-work-order-create-and-runtime-autoconnect-evidence.md`.

## Previous result — 2.0.0-alpha.60

Status: `ALPHA60_DRAFT_COMPONENT_HARD_DELETE_AND_SHARED_ARCHITECTURE_RULES_COMPLETE`.

Alpha.60 replaces only the current normal delete path for eligible WorkOrder-local rows in an editable, unissued draft:

- eligible size, color, fabric, and accessory rows are physically deleted rather than archived;
- deleting a size or color removes its dependent quantity cells and synchronizes WorkOrder/Revision total quantity from the surviving matrix sum in the same transaction;
- requested, cancelled-after-request, completed, issued-revision, and legacy archived rows remain protected by order history and Revision/Event evidence;
- normal mobile material deletion does not create a new `archived_at` tombstone;
- system/company/master library lifecycle remains separate and receives no mutation from this WorkOrder-local flow;
- legacy archive schema/routes remain bounded compatibility debt and are not purged or dropped;
- the shared-architecture working rule is owned once by the canonical Permanent Rules owner and verified by its canonical contract.

The single automated Runtime, canonical shared-architecture contract, owner-approved equivalent isolation evidence, bundled Node 24 Canonical Verify, and physical-iPhone QA passed. The owner confirmed the `250→150→250→200` quantity sequence, size/color and fabric/accessory hard deletes, cancel-preserved material, background/re-entry, and one Development Client Reload without blocking UI failure. Finalization captured that exact state, removed only the isolated QA fixture with mutable residual zero, preserved append-only Event/Receipt evidence, synchronized `APP_VERSION` to `2.0.0-alpha.60`, and produced the normal Git/artifact delivery. Alpha.51 and alpha.56 remain immutable historical evidence.

Evidence: `60-draft-child-hard-delete-and-shared-architecture-evidence.md`.

## Previous result — 2.0.0-alpha.59

Status: `ALPHA59_MOBILE_WORK_ORDER_INPUT_EXPANSION_COMPLETE`.

Alpha.59 completes the Maker mobile WorkOrder input expansion on the accepted alpha.58 size/color read-only baseline:

- draft-only size, color, and quantity commands preserve tenant, permission, expectedVersion, idempotency, conflict, event/receipt, and stable-identity boundaries;
- compact size/color actions, sequential multi-add, deterministic automatic sorting, color palette selection, stable row selection, and parent/child editor lifecycle extend the read model without duplicating it;
- quantity updates transactionally synchronize matrix totals, WorkOrder integer total quantity, and revision snapshots while unchanged updates remain no-ops;
- circular finite-option reels provide modulo identity, central recentering, logical callback/haptic dedupe, and stable selection for target, category, size, color, and unit;
- material and accessory fields use one same-position inline implementation with exact session ownership, stale-blur protection, one-action/one-request behavior, recovery, and quarter-decimal required/allowance input;
- final caret, label, compact-action, cost/image/memo, same-item session, and nested palette corrections were accepted on a physical iPhone;
- automated Runtime QA used one isolated dev/test draft, preserved user products as GET-only, verified the `3/3/9/5/15` read-only projection, and left temporary residuals and user/migration/R2/production mutations at zero;
- size/color archive/restore, fractional total quantity, finished-measurement editing, company common colors, Factory, schema/migration, dependency/native/EAS, R2, and production remain excluded.

Evidence: `59-mobile-work-order-input-expansion-evidence.md`.

## Previous result — 2.0.0-alpha.58

Status: `ALPHA58_MOBILE_SIZE_COLOR_READONLY_COMPLETE`.

Maker mobile size/color and finished-measurement read models, bounded read controller/cache, matrix and measurement presentation, local-only unit conversion, read-only policy, and accepted physical-iPhone UX remain complete. Detailed facts are preserved in `58-mobile-size-color-readonly-evidence.md`.

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
| alpha.59 | mobile WorkOrder input expansion and editor lifecycle | `59-mobile-work-order-input-expansion-evidence.md` |
| alpha.60 | draft-child hard delete and shared-architecture completion | `60-draft-child-hard-delete-and-shared-architecture-evidence.md` |
| alpha.61 | mobile WorkOrder create and DeveloperAutoConnect finalization | `61-mobile-work-order-create-and-runtime-autoconnect-evidence.md` |
| alpha.62 | size measurement standards/templates, Maker authoring, and shared mobile architecture | `62-size-measurement-standards-templates-evidence.md` |
| alpha.63 | mobile architecture stabilization | `63-mobile-architecture-stabilization-evidence.md` |
| alpha.64 | cumulative Maker WorkOrder/document UX and shared mobile architecture | `64-maker-workorder-document-ux-evidence.md` |
| alpha.65 | Maker input, Production authoring, Finished Spec visual selector and technical-flat architecture | `65-maker-input-finished-spec-visual-evidence.md` |
| alpha.66 | WorkOrder identity/lineage, segmented work character, two-axis list filters, compact detail-header layout, canonical readiness refresh, and accepted final boundary | `66-workorder-lineage-sample-list-filter-evidence.md` through `71-workorder-lineage-sample-filter-preissue-evidence.md` |
| alpha.67 | Nth Reorder E2E, issue/PDF/viewer/share integrity, owner-accepted monochrome PDF, and final estimated per-piece cost | `72-nth-reorder-e2e-evidence.md` through `89-alpha67-finalization-evidence.md` |
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

## Completed alpha.62 implementation checkpoint history

Status: `ALPHA62_FINALIZATION_COMPLETE`.

The paragraphs below preserve the accepted pre-finalization checkpoints. Their interim
owner-QA labels are historical; the owner subsequently completed and explicitly approved
the final physical-iPhone QA before alpha.62 finalization.

The owner-approved alpha.62 package implements system/company size-spec templates,
versioned WorkOrder revision snapshots, persisted cm/inch units, exact 1/8-inch input,
mobile template apply/save/edit flows, and the bounded dev/test Runtime guard. The current
measurement UX/structure remediation adds schema-accurate template provenance and a
source-template `수정됨` projection, keeps the card expanded across unit persistence,
uses decimal cm input plus the shared WAFL integer/eighth-inch reel, and owns the canonical
Korean POM names `총장` / `가슴단면` / `어깨너비`. WorkOrder Size is the sole finished-spec
size source of truth. Template apply preserves the exact WorkOrder size set and fills only
matching normalized-size values; size structure commands synchronize stored spec rows in
the same transaction. Spec-only size add/exclude is absent. Size/color UI says `삭제` while
the alpha.60 hard-delete domain contract is retained.

The compact `스펙 불러오기` picker groups system rows as `WAFL 추천` and tenant rows as
`회사 스펙`; the company save sheet distinguishes a new template from an immutable new
version and connects same-company rename/disable without changing a WorkOrder snapshot.
The outer V/X sheet owns apply/cancel, so X performs zero mutation. Dev/test-only route,
guard, product, DB, statement, request, busy-release, and follow-up-read timing separates
the latency layers. Authoritative command-response reconciliation removes redundant detail,
matrix, and size-spec reads from the blocking path except where a replaced projection needs
one exact refresh. Before/after isolated samples reduced representative blocking latency
from about 2.4–3.0 seconds to about 1.0–2.0 seconds.

The template-source and company-save-mode binary choices now use explicit semantic buttons;
the actual templates remain metadata-bearing cards. The shared iPhone size/color delete
`not_found` regression was caused by an alpha.62 external-QA DELETE allowlist omission plus
an alpha.60-only route guard. A new narrow canonical size/color hard-delete guard composes
alpha.60 and alpha.62 approvals. Eligible material hard delete uses the same bounded pair,
while alpha.62 does not enable legacy archive/restore. Alpha.60 physical
delete semantics, linked quantity-cell cleanup, surviving-matrix total synchronization,
replay, and requested/completed/issued/legacy protection remain owned by their existing
canonical repository and contracts.

Product-equivalent Runtime passes local-immediate/persisted unit switching, cell/structure
modified state, WorkOrder-size SOT synchronization, template intersection and exact reapply,
fabric/accessory create/patch/order and eligible hard delete, Korean POM read projection,
replay, Event/Receipt accounting, immutable company-template
v1/v2 behavior, and exact cleanup. A bounded
first run exposed the existing snapshot `source_template_id text` to template `id uuid`
join mismatch; the canonical read model now casts at that exact boundary. The failed
isolated fixture was exact-cleaned with zero mutable residual and preserved append-only
evidence. TypeScript, ESLint errors, build, mutation audit, targeted contracts, and
Canonical Verify pass on the final changed fingerprint. The owner fixture was not mutated by this remediation and is currently a
draft version 40 fixture with matrix XS/S/M/L/XL and a cm S/M/L/XL measurement snapshot for
physical iPhone UX/structure re-QA; that re-QA is `NOT_EXECUTED`.

The current Maker-authoring composition covers basic WorkOrder fields, size/color/quantity,
fabric/accessory create-edit-delete and order request/cancel, image and attachment
create-read-delete, and all alpha.62 spec commands without globally enabling v2 mutation.
Company-created size/color options are reusable within the same tenant; unused rows may be
deleted exactly, while referenced rows become inactive without rewriting WorkOrder history.
The material editor uses the canonical same-company partner list and preserves positive
unit-price readiness. Nullable overview, factory memo, and paired fabric/accessory inputs
now share one typed pure normalization and commit-decision owner: omitted means no change,
explicit empty means clear, a normalized change saves once, and an unchanged blur saves
zero times. The canonical flat reel owns unit and inch option input; the same WAFL
InputSheet/V/X grammar owns the metadata-bearing partner list. Draft material creation
requires positive needed quantity and a valid unit while partner and price remain optional
until external order request. The iOS attachment path normalizes percent-encoded filenames
to NFC and preserves the exact Korean name through upload metadata, DB snapshot, read model,
and mobile display.

Product-equivalent isolated Runtime completed 45 authoring requests, including overview,
factory memo, and fabric/accessory nullable clear re-read plus positive-quantity rejection,
preserved 30 Events and 23
Receipts, detached exact receipt references, removed exact dev/test file objects, and left
zero mutable business residual. The existing owner fixture remains draft/draft at version
82/82 and owner physical iPhone shared-input/material UX re-QA is `NOT_EXECUTED`.

The current size/color chooser uses one shared typed staged-set and diff policy. Option taps
and X are local-only operations; V sends one idempotent logical batch command. When removals
exist, one product-language confirmation summarizes only removed labels and the affected
entered quantity. The server validates the whole diff before one tenant-scoped transaction
that owns additions, eligible alpha.60 hard deletes, linked quantity cleanup, WorkOrder-size
finished-spec synchronization, and surviving matrix totals. This is not a sequence of
per-item HTTP mutations. Company custom-catalog deactivation remains a distinct lifecycle.

The same remediation moves all unset overview values to the shared muted `미지정` semantic,
keeps partner selection in the shared flat rich WAFL picker, removes the app-owned numeric
submit key, and reconciles successful cm/inch unit persistence without an unrelated detail,
matrix, or template follow-up GET. Normal copy now uses `사용자 저장 스펙`; v1/v2 and internal
version-preservation explanations remain hidden while immutable template versioning stays
intact. Isolated Runtime and historical contracts pass, including request/transaction
accounting, replay, hard-delete protection, exact cleanup, and zero mutable residual.
Canonical Verify under Node 24.14.0 passes on the final changed set.
The exact owner fixture remains draft/draft version 113/113 with one snapshot, zero generated
documents, and zero public tokens; physical iPhone batch/saved-spec re-QA is `NOT_EXECUTED`.

The next owner re-QA checkpoint keeps that alpha.62 boundary and adds the iPhone focus,
pending-scope, and compact-selection remediation. Vendor selection now adapts to the same
canonical flat WAFL scroll/reel option owner as the target selector, with readable long names
and staged X/V behavior. A shared typed transition policy and serialized entity-version queue
allow changed/cleared inline field A to save once while field B focuses immediately; unchanged
field A remains a zero-mutation transition. The cm/inch preference uses command-scoped pending,
so unrelated Size/Color staging remains enabled and a following mutation queues behind the
returned authoritative version without an unrelated read. Size and Color render through one
accessible option-grid owner with preferred four- and three-column default layouts and separate
registered-option sections. User-facing source copy is `WAFL 추천` / `사용자 저장 스펙`, while
immutable internal template versioning is unchanged. The preserved owner fixture is read-only
audited at draft/draft version 127/127 with zero generated documents and zero public tokens;
physical iPhone focus/pending/grid re-QA remains required.

The final architecture-cleanup checkpoint replaces the vendor adapter's flat option branch
with the same canonical `single-choice-reel` render policy and reel column used by target
selection. Measurement-unit success promotes the current valid matrix/spec projection to
the command's next-version cache key before entity-version reconciliation, so the complete
controller chain performs no size-color GET, no size-spec GET, no unrelated reload, and no
global disable. The canonical owners now include shared Sheet V/X, semantic two-way choice
buttons, option grids, inline transition/serialized mutation, command-scoped pending,
projection-version transition, and low-level mobile request transport. A wholesale
MobileWorkOrderExperience rewrite and full domain split of the API facade remain bounded
technical debt rather than a speculative final-QA refactor. Current isolated measurement,
batch, and Maker Runtime suites pass with exact cleanup; the owner fixture remains read-only
preserved at draft/draft version 140/140 with one snapshot and no document or public token.
Owner physical iPhone final QA is `NOT_EXECUTED`.

APP_VERSION is `2.0.0-alpha.62`, and the result is finalized at
`ALPHA62_FINALIZATION_COMPLETE`. The owner fixture remains preserved; finalization performs
read-only audit only. Factory, AI image generation, production mutation, R2 mutation,
dependency/native/EAS work, and alpha.63 expansion remain outside this boundary.

## Next boundary — alpha.64 owner QA and finalization

The current alpha.64 candidate stops at physical-iPhone re-QA. Owner visual/IA acceptance
must cover actionable readiness feedback, collapsed size/color quantity disclosure, image/PDF
delivery attachments in the controlled Viewer, the truthful production-category placeholder,
and real requested-material Quick Delivery local preview before the already approved R0
issue/PDF/download/share/managed-QR flow. Version promotion, commit, push, and release artifacts
require a separate finalization after that owner evidence. Quick Delivery persistence/PDF,
R1 correction, Factory/AI, production mutation, dependency/native/EAS work, and migration `017`
remain outside the current boundary.

## Active alpha.65 static garment asset-overlay review

The visual Finished Spec selector now uses four fixed package-authored garment technical-flat assets as the base recognition layer and keeps the 55/55 stable-code measurement definitions as a separate dynamic overlay. No procedural silhouette generator, selection-state asset geometry, schema/migration, or business mutation is introduced. Automated screenshot evidence and contracts are a rejection gate only; normal success stops at `ALPHA65_STATIC_GARMENT_ASSET_OVERLAY_IPHONE_REQA_REQUIRED` pending owner physical-iPhone visual approval. APP_VERSION remains `2.0.0-alpha.64`; commit, push, and release remain out of scope.

Owner physical review rejected the remaining always-visible inactive overlay as a double-image effect. The bounded declutter correction kept all four static garment owners and all 55 mappings while removing inactive full measurement geometry. That checkpoint is historical input to the focused-preview candidate below; the current diagram no longer retains a neutral label index or plural selected-code overlay. APP_VERSION and delivery boundaries remain unchanged.

The current focused-preview candidate keeps unrestricted staged multi-selection but decouples the diagram into one ephemeral explanation at a time. Fresh open and unmapped/custom interaction render garment-only; a mapped activation previews that one measurement, another activation switches the preview while preserving all checks, and V still applies the complete staged set. All four static flats use uniform scale/translation, the upper and lower source assets are corrected for neutral technical-flat recognition, and the 55/55 catalog, schema, migration ledger, data, and version boundaries remain unchanged. Automated completion targets `ALPHA65_FOCUSED_MEASUREMENT_PREVIEW_TECHNICAL_FLAT_IPHONE_REQA_REQUIRED` pending owner physical-iPhone review.

Owner physical review still read upper/outer/dress single views as doubled sleeves. The current bounded continuation therefore makes front/back separation explicit: T/B/O/D each render an authored front-left and back-right technical flat, for eight exact SVG/TypeScript mirror views. Garment-only remains free of measurement geometry and labels; the singular ephemeral preview routes each of the unchanged 55 mapped stable keys to one documented front or back side. Grid staging, X/V, direct-create, persistence, schema, migration, and version boundaries do not change. Automated completion targets `ALPHA65_FRONT_BACK_TECHNICAL_FLAT_PREVIEW_IPHONE_REQA_REQUIRED` pending owner physical-iPhone review and retains `PHYSICAL_VISUAL_RESULT_NOT_INFERRED`.

The physical shoulder/armhole fidelity follow-up keeps the accepted two-view and focused-preview architecture. Only upper, outer and dress front/back assets are reauthored so one continuous silhouette carries the neckline-to-shoulder-to-sleeve flow and the armhole remains a quiet construction seam; lower stays byte-stable. The 55 routes, grid staging, X/V, direct-create and all persistence/version boundaries remain unchanged. The target is `ALPHA65_FRONT_BACK_SHOULDER_ARMHOLE_FIDELITY_IPHONE_REQA_REQUIRED`, with physical visual acceptance still not inferred.

The subsequent neckline/outer-pocket correction preserves that two-view, focused-preview, and shoulder/armhole result. It changes only authored T/D front/back neck openings to clean round necklines and simplifies O front/back neck/collar construction plus the O-front pocket pair to straight non-tilted geometry. B remains byte-stable, the 55/55 routes and overlay `0..1` remain unchanged, and the target is `ALPHA65_NECKLINE_OUTER_POCKET_FIDELITY_IPHONE_REQA_REQUIRED`. Owner physical-iPhone acceptance remains pending and is never inferred from automated evidence.

## Completed Version Delta — 2.0.0-alpha.67

Status: `ALPHA67_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA67_REORDER_PDF_BRANDED_SHARE_COMPLETE`.

Only issued/finalized 본생산 original or direct Reorder rows can create the next Reorder.
The server owns direct-source/root/revision lineage and allocates the next series-wide round
under the root lock; client round selection is forbidden. Product/spec configuration is copied,
Size/Color production quantities and lifecycle execution state are reset, and the new total/due
date come from the request. Representative image and explicitly output-included final-revision
attachments are independently copied without filename inference. Mobile adds the create sheet,
direct Overview navigation, and original-plus-direct-Reorders history while retaining the flat
list badges/filters. The physical-blocker remediation makes Series History an optional contextual
read instead of a detail-entry precondition, commits `created.result.workOrderId` before any
post-create refresh, accepts exclusion by the current filter, and restricts retry to read-only
hydration of that same created row. The derivative Worker deployment now permanently verifies
the `IMAGES` plus `R2_BUCKET` bindings and passes a stream—not an `ArrayBuffer`—to the Images
transform input. Migration ledger remains `20/20`, migration `021` is absent, and actual
Rework creation and Additional Process Order remain deferred.

The issue/PDF/material physical-blocker continuation keeps that Reorder architecture intact.
Readiness and issue numbering share one item-segment resolver: ASCII item codes are retained,
while Korean item text uses the stable canonical major-category code. PDF generation is guarded
by `DOCUMENT_R0` capability rather than an alpha.64 runtime name, and issue success is never
rolled back by a later PDF failure; `PDF 다시 생성` creates only a new PDF attempt. Draft
never-requested material rows use hard delete, cancelled history-bearing editing rows use the
existing history-preserving archive lifecycle, and requested/completed rows remain protected.
Production complete/cancel actions use matching compact icon-only slots. Evidence is recorded in
`74-issue-pdf-material-delete-action-ui-evidence.md`; physical-iPhone acceptance and full
alpha.67 completion are not inferred.

The next bounded PDF parity checkpoint fixes the physical mobile generation/viewer gap without
changing Reorder copy/reset semantics. PDF generation receives a document-specific bounded
transport deadline, current-generation status reconciliation, and generation-only retry that
reuses an existing generated or recent pending identity. Mobile view resolves the already-created
embedded-QR public access identity and opens `/v`; public session/file/download remain separate
from the still-protected workspace file route. Evidence is recorded in
`75-pdf-generation-retry-public-viewer-evidence.md`. Full alpha.67 and physical-iPhone acceptance
remain pending.

The subsequent mobile-image/PDF integrity checkpoint records actual uploaded object size and hash
at image completion and retains strict hashed-asset validation. Existing hash-null image rows are
not rewritten: PDF generation may consume them only through bounded MIME/object validation and an
in-memory actual hash. Recent owner attempts had matching DB/R2 sizes; their first failing stage was
an overflowing landscape cover that produced extra landscape pages and tripped the orientation
gate. The cover is now physically bounded to one landscape page. Evidence is recorded in
`76-mobile-image-asset-integrity-pdf-evidence.md`; owner physical-iPhone acceptance remains pending.

The next bounded checkpoint restores actual browser hydration for `/v`, removes duplicate native
share URL delivery, and performs the explicitly approved DEV/TEST WorkOrder clean-base reset only
after verified backup and KEEP/DELETE/R2 manifests. It does not redesign PDF, add schema, mutate
production/owner fixtures, bump APP_VERSION, or infer physical PASS. Evidence is recorded in
`77-viewer-share-reset-cleanbase-evidence.md`.

The post-clean-base physical-correction checkpoint then aligns image completion reconciliation,
Size/Color deletion totals/spec columns, Basic Process issue readiness and issue-time completion,
Material 30/100 character grammar, factory-delivery memo truth, and human-readable PDF product
classification. Public `/v` remains the share target, not the mobile View target. Expo 55 now has
one cross-platform native PDF renderer over the existing workspace-authenticated internal file
route; the in-app surface owns back navigation, vertical pages, page count, zoom, bounded retry,
and native-cache cleanup without exposing raw R2 or a secret-bearing URL. The checkpoint remains
device-gated pending a matching EAS iOS Development Build, owner installation, and strict runtime
restoration. Evidence is recorded in
`78-post-cleanbase-physical-corrections-inapp-pdf-evidence.md`; physical result is not inferred.

The Document UX/share/save continuation keeps that native build and renderer, adds explicit
previous/next page controls synchronized with scroll, removes the requested Basic Process manual
complete action, and routes Save through verified authenticated bytes plus the native local-file
surface instead of Safari. Share/QR metadata becomes four rows, the restrained native share body
contains one viewer URL, and public `/v` mounts the session-authorized PDF inline with Download as a
secondary action. Branded public viewer deployment remains deferred pending an exact production
origin owner. Evidence is recorded in `79-document-ux-share-save-evidence.md`; owner physical result
is not inferred.

The identity/PICK/basic-spec continuation then locks issued identity, adds category-aware Season and
Detail PICK, activates the source-backed WAFL starter spec, demotes optional Material gaps to
readiness warnings, and replaces browser plug-in PDF display with self-hosted PDF.js pages. The
pagination/viewer-touch continuation replaces fixed Finished Spec chunks with capacity-aware packing,
gives full-view Spec one vertical owner, and formats quantity decimals without meaningless trailing
zeroes. Evidence is recorded in `80-identity-pick-basic-spec-readiness-public-viewer-evidence.md` and
`81-pdf-spec-pagination-viewer-touch-format-evidence.md`.

The current bounded cleanup removes same-orientation nested VirtualizedLists from Season/Detail
PICK, filters normal WAFL recommendations to the current category basic template, and simplifies the
native viewer to vertical scroll/zoom plus a sticky bottom WAFL `닫기` action. Issued PDF cover summary
now owns the Basic Process human partner; its detail process table is Additional-only and omitted
when empty, and the visible `개정차수` row is absent while internal R0 identity stays unchanged.
Evidence is recorded in `82-viewer-close-pdf-process-picker-cleanup-evidence.md`; physical-iPhone
acceptance remains pending and is not inferred.

The picker/action/list/Reorder UX continuation promotes Season and Detail Item bodies from generic
static rows to the canonical `WaflOptionGrid` selected-cell grammar while preserving one non-virtualized
sheet body and moving `+ 직접입력` outside recommendation options. Requested Basic Process shows the
shared warning action as icon plus `발주취소`. ISSUE awaits authoritative detail reconciliation, patches
the list model through the existing workflow status owner, and performs one invalidated-query refresh
on list return. Reorder creation is now an `아니오 / 예` confirmation: the server still allocates the
global round, while the new draft starts at quantity zero and due null and opens by returned ID. The
owner explicitly accepts all pending physical checks through the prior checkpoint; only these new
changes remain physical re-QA. Evidence is recorded in
`83-picker-action-list-reorder-ux-evidence.md`.

The final PDF/PICK refinement candidate replaces Season and Detail's interim selection cells with
the canonical paired and single option reels, shortens the visible requested Basic Process cancel
caption to `취소`, and rebuilds the issued document around one branded landscape summary plus
capacity-packed portrait detail pages. The PDF no longer contains QR/status/revision UI and its
generation path no longer auto-creates embedded public access; explicit manual Share, `/v`, Save,
in-app View, R2 persistence, and legacy token reads remain intact. Empty optional sections omit,
Basic Process stays cover-only, Additional Process stays table-only, and wrapped tables/images have
bounded continuation rules. Evidence is recorded in
`84-final-pdf-redesign-picker-reel-polish-evidence.md`; physical result is not inferred.

The portrait visual-fidelity continuation supersedes only that candidate's landscape presentation.
All pages are now A4 portrait. The fixed cover follows the owner primary portrait SOT, keeps the
document number in the title metadata instead of an information card, and uses seven compact facts,
a warm bounded memo, and a five-cell summary with secondary context. Detail
pages retain the accepted data and generation owners with numbered section bars, centered table
grammar, seven-row dense Material bounds, and two-image portrait attachment pages. Normal, rich,
and sparse evidence artifacts are rendered page-by-page at 170 dpi and compared with the approved mock before checkpoint publication.
Evidence is recorded in `85-portrait-pdf-visual-fidelity-evidence.md`; prior non-PDF physical acceptance
is preserved and only this PDF delta remains physical re-QA.

The final alpha.67 PDF refinement makes all document chrome strictly monochrome while preserving
source color inside representative and selected attachment images. The ten cover facts remain in
the owner-defined order; Basic Process `unitPrice` and persisted `amount` are the sole per-piece and
total labor-cost values. Accessory uses a reusable four-hole button icon, and Finished Spec emits a
fresh cm section followed by a separately fresh inch section derived from cm through the canonical
1/8 formatter. The owner-applied branded Viewer V4 is preserved: new links use the configured
`share.wafl.co.kr` origin, only `/v`, required framework assets, and the exact public Viewer APIs are
admitted on that host, while root/private routes stay 404 and internal file APIs remain workspace-
authenticated. Evidence is recorded in `88-final-pdf-monochrome-branded-viewer-evidence.md`; only
the new PDF visual delta remains physical re-QA.
## Alpha.74 responsive Product Sketch shape authoring

Status: `ALPHA74_SKETCH_RESPONSIVE_SHAPE_AUTHORING_IPHONE_IPAD_QA_REQUIRED`.

The authenticated DEV/TEST Product Sketch exposes six authoring tools: `펜 / 선 / 화살표 / 사각형 / 타원 / 텍스트`.
Rectangle and ellipse reuse Drawing Scene v1 and the selected SVG projection. A shared pure bounded-shape authoring owner
keeps active preview outside Scene/history, clamps inverse-projected points to the canonical world, normalizes bounds in
every drag direction, rejects WORLD-degenerate shapes, and commits once on release. The responsive toolbar wraps without
shrinking below its usable touch width. Phone portrait and tablet portrait/landscape all project the same immutable Scene;
a material canvas-layout generation change cancels an active drawing gesture before a stale release can commit. No eraser,
selection, zoom/pan, image, pencil, PDF integration, WaflInputSheet refactor, dependency, native/config/EAS, API/schema,
migration, release, or Production exposure is added. APP_VERSION stays `2.0.0-alpha.73`; physical PASS is not inferred.
