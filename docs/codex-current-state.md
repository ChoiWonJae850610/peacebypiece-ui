# WAFL Current Baseline

Alpha.79 is finalized at `ALPHA79_FINALIZATION_COMPLETE` with product checkpoint `ALPHA79_COMPLETE`. Owner actual Final
Combined Smoke is `PASS` on iPhone and iPad mini: the healthy exact-current-Revision generated PDF remains usable after
re-entry, the terminal deleted document remains inaccessible without historical fallback or automatic regeneration, and
the DEV/external-QA current-versus-historical selector clears generated actions and tokens when current state becomes
none. Stage 2A iPad-mini, Stage 3A iPhone, and Stage 3B iPhone focused physical results remain recorded as prior actual
evidence; unrun stage/device combinations are not inferred. Regular/Large iPad and Android remain `NOT_RUN`.
APP_VERSION is `2.0.0-alpha.79`. The finalized lifecycle preserves exact current Revision ownership, immutable generation
attempts, same-Revision N+1 recovery, exact-created-object failure cleanup, logical revoke access denial, physical purge
only after exact absence proof, retained audit rows, and newest-attempt authority. Alpha.78 Drawing Scene v1, WORLD
`1000×1400`, Sketch output `1500×2100` at `5:7`, and Camera-independent output remain unchanged. Finalization adds no
product behavior, dependency/native/config/EAS, API/schema/migration, business-data mutation, tag, or release.

Alpha.79 Stage 3B revoked-artifact purge and terminal deleted lifecycle is implemented at
`ALPHA79_STAGE3B_REVOKED_ARTIFACT_PURGE_DELETED_IPHONE_IPAD_QA_REQUIRED`; Owner Stage 3B physical result is not
inferred. One tenant-scoped, receipt-backed command binds the exact current WorkOrder, Revision, document, generation,
and server-owned storage key, permits only `revoked -> deleted`, HEAD-checks and deletes at most that exact object,
proves absence, then retains the audit row while finalizing `deleted`. A revoked row whose object is already absent can
reconcile safely; ambiguous present/unknown outcomes remain revoked. Newest deleted state is authoritative, cannot fall
back to older output, cannot regenerate automatically, and exposes no View/Save/Share/Viewer/token/Retry action. Exact
DEV evidence proved one automated-fixture delete, replay/second request delete zero, row/storage metadata retention,
file/Preview/Viewer/token denial, and unrelated/Production/Owner R2 mutation zero. The physical fixture
`QA A79 generated revoke access` remains revoked with a healthy exact object for the Owner's one `PDF 삭제 QA` action.
APP_VERSION remains `2.0.0-alpha.78`; migration remains `22/22` with new/Production migration `0/0`.

Alpha.79 Stage 3A logical generated-document revoke and access invalidation is implemented at
`ALPHA79_STAGE3A_REVOKE_ACCESS_INVALIDATION_IPHONE_IPAD_QA_REQUIRED`; Owner physical result is not inferred. A bounded,
tenant-scoped, idempotent command validates the exact current WorkOrder, Revision, document, and generation before the
existing legal `generated -> revoked` transition. The transaction revokes only that document's active access tokens and
emits one event; it does not mutate the WorkOrder/Revision or delete/overwrite R2. The newest attempt remains authoritative,
so revoked N2 never falls back to generated N1. Workbench View/Save/Share/Viewer/token/Retry targets, direct file access,
preview target, branded/public Viewer, and token creation/resolution are denied after revoke. DEV evidence proved the
object remains healthy in R2 while every product access path is denied, replay/second/concurrent revoke is safe, and the
exact Owner fixture `QA A79 generated revoke access` remains healthy for physical QA. APP_VERSION remains
`2.0.0-alpha.78`; migration remains `22/22`; Stage 3B physical deletion remains zero.

Alpha.79 Stage 2B missing/corrupt generated-artifact recovery is implemented at
`ALPHA79_STAGE2B_MISSING_CORRUPT_RECOVERY_IPHONE_IPAD_QA_REQUIRED`; Owner physical result is not inferred. The newest
attempt on the exact current Revision now owns document state, and a generated row is usable only while its exact R2
object passes metadata, size, SHA-256, `%PDF-`, and `%%EOF` checks. Missing/corrupt artifacts suppress View, Save,
Share, Viewer, and token targets and expose generation-only Retry; transient storage errors remain distinct and do not
auto-regenerate. Recovery always creates generation N+1 and never rewrites a historical generated row. Exact-owned DEV
evidence proved missing N1 -> healthy N2 and corrupt N1 -> healthy N2, with row immutability, same-key replay, Revision
delta `0`, issue-event delta `0`, and unrelated R2 mutation `0`. The missing fixture's recovered N2 object is intentionally
missing for one Owner physical Retry. Stage 3 remains closed. APP_VERSION stays `2.0.0-alpha.78`; migration remains
`22/22`.

Alpha.79 Stage 2A generation failure, retry, and exact-owned R2 cleanup is implemented at
`ALPHA79_STAGE2A_FAILURE_RETRY_R2_CLEANUP_IPHONE_IPAD_QA_REQUIRED`; Owner physical result is not inferred. The canonical
generation service accepts internal execution hooks only, records an exact object only after a successful PUT, marks a
pending attempt failed, and deletes plus absence-verifies only that attempt-owned object before any finalization
transaction begins. An ambiguous finalization transaction never authorizes deletion. The public and mobile generation
surfaces cannot select a failpoint. A local-only, non-production, current-Maker capability and tenant-permission guarded
DEV runner proved before-PUT `0/0`, after-PUT-before-finalize `1/1`, orphan `0`, then the existing generation Retry
produced one valid current-Revision PDF without Recipe re-issue or a new Revision. The dedicated physical fixture
`QA A79 generation failure retry` remains accounted. Its Owner iPad-mini QA is PASS and iPhone is NOT_RUN. Stage 2B
supersedes the formerly deferred missing/corrupt policy; Stage 3 revoke/delete remains closed. APP_VERSION stays
`2.0.0-alpha.78`; migration remains `22/22`.

Alpha.79 Stage 1.5 physical Revision artifact QA harness is implemented at
`ALPHA79_STAGE1_PHYSICAL_HARNESS_IPHONE_IPAD_QA_REQUIRED`; Owner physical result is not inferred. The authenticated
DEV/external-QA header exposes `A79 문서 QA`, which opens a server-isolated in-memory harness containing historical
Revision A generated output plus current Revision B none/pending/failed/generated states. Production Workbench and the
harness consume the same pure current-Revision Workbench model for View, Save, Share, Viewer, access-token, and Retry
ownership. Harness actions record synthetic target ids only, Retry increments a local generation counter, and Recipe
issue count remains zero. Production navigation exposure, API/DB/R2/business mutation, Stage 2, schema/migration,
dependency/native/config/EAS, version, commit/push/tag/release/finalization deltas remain zero.

Alpha.79 Stage 1 current-Revision artifact identity is implemented at
`ALPHA79_CURRENT_REVISION_ARTIFACT_IDENTITY_IPHONE_IPAD_QA_REQUIRED`; Owner physical result is not inferred. The mobile
document Workbench now derives `generated/pending/failed/none` only after filtering the WorkOrder-wide document history
by `detail.header.currentRevisionId`. View, Save, Share, viewer identity, access-token management, pending feedback, and
generation-only Retry all consume that single projection. A current Revision without a generated document clears tokens,
and generation/document identity guards prevent an older async token result from restoring historical controls. The
server history endpoint, exact-Revision generator lock/idempotency, immutable document rows, PDF/R2 integrity, Scene v1,
and finalized alpha.78 behavior are unchanged. APP_VERSION remains `2.0.0-alpha.78`; migration remains `22/22`; API/
schema, dependency/native/config/EAS, Production/Owner/ambiguous mutation, commit/push/tag/release/finalization deltas are
all zero. Stage 2 failure/orphan/corruption work has not started.

Alpha.78 is finalized at `ALPHA78_FINALIZATION_COMPLETE` with product checkpoint `ALPHA78_COMPLETE`. Owner actual
physical QA is `PASS` on iPhone and iPad mini for the corrected Sketch Preview/PDF frame: the visible paper is centered
at `5:7`, the former side gutters are absent, Drawing geometry is unchanged with crop/stretch `0`, Camera state remains
independent, and PDF/Download agree. Print, Regular/Large iPad, and Android actual-device execution remain `NOT_RUN` and
are not inferred PASS. The exact-revision saved `primary_sketch` Scene v1 remains the immutable output source; WORLD
`1000×1400` maps to `1500×2100` at uniform scale `1.5` and offsets `0,0`, screen Preview is responsive and capped at
`150mm`, and PDF/Print is `150mm×210mm`. APP_VERSION is `2.0.0-alpha.78`. Finalization adds no product behavior,
Scene/API/schema/migration, dependency/native/config/EAS, Production/Owner/ambiguous mutation, tag, or release.

Alpha.77 is finalized at `ALPHA77_FINALIZATION_COMPLETE` with product checkpoint `ALPHA77_COMPLETE`. Owner actual
physical QA is `PASS` on iPhone and iPad mini for Selection resize and endpoint editing: Rectangle/Ellipse corner
handles, Line/Arrow semantic endpoints, transient WORLD-coordinate preview, exact Undo/Redo, and second-finger Camera
takeover all retain the accepted alpha.76 Drawing behavior. Regular/Large iPad and Android actual-device QA remain
`NOT_RUN` and are not inferred PASS. APP_VERSION is `2.0.0-alpha.77`. Finalization adds no feature behavior, Scene/API/
schema/migration, dependency/native/config/EAS, Production/Owner/ambiguous business mutation, tag, or release. Scene
schema v1, WORLD `1000×1400`, migration `22/22`, and Production `스케치(준비 중)` remain.

The completed alpha.77 Selection resize and endpoint-editing Delta established that the
existing `선택 및 이동` tool now projects four constant-screen-space corner handles for Rectangle/Ellipse and semantic
start/end handles for Line/Arrow. Handle hit-testing precedes ordinary topmost selection and forgiving Move pickup;
dragging a handle inverse-projects through the current Camera into one transient WORLD-coordinate replacement preview.
Rectangle/Ellipse keep the opposite corner fixed, remain axis-aligned, do not flip, and reuse the canonical `1.5` WORLD
minimum size. Line/Arrow keep the opposite endpoint fixed, reuse the canonical `1.5` WORLD minimum length, and keep
arrowheads renderer-derived. One meaningful release creates one Scene/history commit; no-op and every cancellation path,
including second-finger Camera takeover, create none. Freehand/Text expose no handles and retain Move-only behavior.
Scene v1, WORLD `1000×1400`, explicit Save, Camera/HUD, partial Eraser, toolbar, orientation, dependency/native/config/EAS,
API/schema and migration `22/22` remain unchanged.

Alpha.76 is finalized at `ALPHA76_FINALIZATION_COMPLETE` with product checkpoint `ALPHA76_COMPLETE`. Owner actual
physical QA is `PASS` on iPhone and iPad mini for the latest centered Cover, focal pinch Zoom, two-finger Pan, Fit
`100%`, integer Zoom HUD, Pan-only stable HUD, and Pen/Eraser/Selection Move interaction isolation; iPad-mini
orientation regression is `0`. A fresh or reopened Sketch starts at centered Cover for its current viewport and may
therefore show a value above `100%` such as `111%`; Camera zoom `1` is full-paper Fit and exactly `100%`. The HUD remains
`Math.round(camera.zoom * 100)%`, and Pan alone cannot change it. Regular/Large iPad and Android actual-device QA remain
`NOT_RUN` and are not inferred PASS. APP_VERSION is `2.0.0-alpha.76`. Finalization adds no feature behavior, Scene/API/
schema/migration, dependency/native/config/EAS, Production/Owner/ambiguous business mutation, tag, or release. Scene
schema v1, WORLD `1000×1400`, migration `22/22`, and Production `스케치(준비 중)` remain.

Alpha.76 Zoom Percent HUD is implemented at `ALPHA76_ZOOM_PERCENT_HUD_IPHONE_IPAD_QA_REQUIRED`, pending Owner
physical iPhone and iPad-mini QA. Product Sketch now derives one integer label as `round(camera.zoom * 100)` and
renders an existing magnifier icon plus that percent in a compact, centered, read-only footer row immediately above
Close/Save. The HUD follows the current transient Camera projection, captures no touch input, and adds no plus/minus,
Fit, menu, animation, persistence, Scene/history/dirty/Save/API/schema/migration, dependency/native/config/EAS, or
output behavior. All alpha.76 raw multi-touch acquisition, pinch/Pan/rebase/frame-coalescing, Drawing tools, layout,
and orientation contracts remain unchanged. Physical PASS is not inferred.

Alpha.76 Raw Multi-Touch Camera Acquisition correction is implemented at
`ALPHA76_RAW_MULTITOUCH_CAMERA_ACQUISITION_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini
re-QA. The middle Product Sketch workbench raw `onTouchStart/Move/End/Cancel` stream is now the only physical
multi-touch Camera owner: the second-finger touch-down captures the stable pair and arms a Camera gesture immediately,
without waiting for PanResponder movement or drag slop. PanResponder remains one-finger Drawing-only and is hard-
guarded during Camera activity and until every touch from the Camera interaction is released. Raw takeover restores
the pre-first-finger Selection and cancels Pen/shape/Eraser/Move/pending-Text transient work exactly once with no Scene
or history commit. The existing page-space pinch, focal/Pan math, Fit/Max clamp-boundary rebase, authoritative camera
ref, RAF projection, Scene v1, persistence, orientation, dependency/native/config/EAS/API/schema, and migration
boundaries remain unchanged. Physical PASS is not inferred.

Alpha.76 Pinch Clamp Boundary Rebase correction is implemented at
`ALPHA76_PINCH_CLAMP_BOUNDARY_REBASE_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini re-QA.
The exact proportional zoom equation remains `baseZoom * currentPageDistance / basePageDistance` with Fit `1` and
maximum `4`. While a stable touch pair keeps pushing farther beyond either clamp, the canonical camera-gesture owner
rebases from that frame's clamped authoritative camera, page centroid/distance, reconstructed local centroid, WORLD
anchor, and viewport generation. A direction reversal therefore leaves Fit or maximum zoom immediately instead of
repaying hidden overshoot distance. Boundary rebase does not change the rendered camera on its frame; normal-range
pinch retains its original baseline, and page-space tracking, focal Pan, stable identifiers, RAF coalescing, takeover,
Scene/history/Save/API/schema/migration/dependency/native/config/EAS boundaries remain unchanged. Physical PASS is not
inferred.

Alpha.76 Native Pinch Tracking + Camera Frame Coalescing correction is implemented at
`ALPHA76_NATIVE_PINCH_TRACKING_FRAME_COALESCING_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and
iPad-mini re-QA. The native camera adapter now preserves stable touch identifiers plus workbench-local acquisition
coordinates and absolute page coordinates. Gesture acquisition anchors WORLD from the local centroid, while every
continuous zoom ratio and centroid delta uses the stable page-space pair; local focal position is reconstructed from
the acquisition local centroid plus page-centroid displacement. React Native's current active `touches` set already
contains each member's current sample, so no parallel changed-touch cache is added. Every valid native sample updates
the authoritative camera ref immediately, while a bounded latest-value RAF owner projects at most once per display
frame; gesture end flushes the latest value and Cover/reset/viewport invalidation/close/unmount cancel stale frames.
Scene/history/dirty/Save/API/schema/migration/dependency/native/config/EAS remain unchanged. This tightens the current
Initial Cover/pinch contract without changing its takeover, rebase, focal equation, `1..4` bounds, or persistence
boundary. Physical PASS is not inferred.

Alpha.76 Initial Cover + Pinch Reliability correction is implemented at
`ALPHA76_INITIAL_COVER_PINCH_RELIABILITY_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini
re-QA. A fresh or reopened Product Sketch now consumes its first valid workbench viewport exactly once to derive a
centered Cover camera: `zoom = clamp(max(viewportWidth/1000, viewportHeight/1400) /
min(viewportWidth/1000, viewportHeight/1400), 1, 4)`. Canonical Fit remains zoom `1`, so pinch may zoom out from
Cover to the full paper; tool changes, Undo/Redo, Save, and later layout events never reapply Cover. Multi-touch
camera ownership starts as soon as two touches exist anywhere in the workbench, uses stable native touch identifiers
instead of array order, and rebases from the current camera when pair membership changes. Camera takeover restores
any provisional first-finger Selection before cancelling authoring, while small pinch deltas and direction reversals
remain continuous. Camera state stays transient and absent from Scene/history/dirty/persistence/network/output. This
supersedes only the earlier fresh-open Fit presentation and strengthens its touch-pair arbitration; all other alpha.76
camera and Drawing boundaries remain. Physical PASS is not inferred.

Alpha.76 Fit Paper + Pinch Zoom + Two-Finger Pan is implemented at
`ALPHA76_FIT_PAPER_PINCH_ZOOM_PAN_IPHONE_IPAD_QA_REQUIRED`, pending Owner physical iPhone and iPad-mini QA. Product
Sketch now keeps its semantic header and seven-control toolbar fixed at the top, its state and Close/Save actions fixed
at the bottom, and uses all remaining middle height as one clipped muted workbench viewport. The existing transient
`DrawingCamera` starts at full-paper Fit on each open, projects the canonical WORLD `1000×1400` white paper and SVG
Scene through one transform, and supports focal-point-preserving pinch zoom `1..4` plus two-finger centroid pan with
paper-edge camera bounds. Raw inverse projection rejects one-finger starts outside the paper before edge clamp. A
second touch cancels every uncommitted Pen/shape/Move/Eraser/Text transient before the camera gesture, and a remaining
finger cannot become Drawing input until full release. Camera state never enters Scene v1, history, Save/API, output,
or dirty state; Undo/Redo and same-session Save preserve it, while its fresh-open Fit presentation is superseded by
the Initial Cover contract above. This explicitly supersedes
only the prior compact fixed-ratio host/outer-scroll presentation and paper-only responder placement. A75/A76 tools,
object Move, partial Eraser, explicit Save, and orientation/native policy remain unchanged. Physical PASS is not
inferred.

Alpha.76 Sketch Workspace Compact Layout correction is implemented at
`ALPHA76_SKETCH_WORKSPACE_COMPACT_LAYOUT_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini
re-QA. Product Sketch now uses one compact outer ScrollView fallback whose normal portrait content stays top-stacked:
semantic `스케치` heading, seven-control toolbar, exact `5:7` white paper, one-line state, then Close/Save. The paper
host consumes the established safe content width and derives its height from canonical WORLD `1000×1400`; it no
longer flex-fills remaining height or vertically centers the paper. Only gestures beginning on the inner white paper
remain Drawing-owned, while short-height scrolling begins from outer chrome. Scene v1, uniform viewport projection,
visible-paper/dead-zone correction, A75 Eraser, A76 Selection pickup/Move, explicit Save, and orientation/native
policy remain unchanged. Physical PASS is not inferred.

Alpha.76 Visible Canvas / WORLD Surface Alignment correction is implemented at
`ALPHA76_VISIBLE_CANVAS_WORLD_SURFACE_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini re-QA.
Product Sketch now separates the flexible muted editor stage from one centered active white Drawing surface fitted
exactly to the canonical WORLD `1000×1400` aspect. Only that inner surface owns PanResponder, viewport measurement,
SVG dimensions, and Drawing-paper color, so visible white paper and interactive WORLD have the same boundary while
unused top/bottom or side fit margins remain visibly muted and non-interactive. The existing arbitrary-viewport uniform
transform, inverse projection, Scene v1, A75 Eraser, A76 Move/pickup, explicit Save, and orientation/native architecture
remain unchanged. Physical PASS is not inferred.

Alpha.76 Selection Move Pickup UX correction is implemented at
`ALPHA76_SELECTION_MOVE_PICKUP_UX_IPHONE_IPAD_REQA_REQUIRED`, pending Owner physical iPhone and iPad-mini re-QA.
The top-level Selection control now uses the installed Lucide `Hand` icon and `선택 및 이동` accessibility label
without changing its internal tool identity, active state, or minimum touch target. Selection pointer-down keeps the
canonical precise/topmost WORLD hit-test first; only when that returns no object may the already-selected element use
the canonical selection bounds plus one inverse-projected shared spacing token as a forgiving pickup fallback. Thus
another actual topmost object inside a selected bounding box still wins, rectangle/ellipse interiors and thin vectors
can be re-grabbed reliably, and only true empty space deselects. A no-drag fallback tap keeps selection with Scene/
history `0/0`; all alpha.76 WORLD move, transient preview, one-release/one-history, Undo/Redo, bounds clamp, text
keyboard suppression, and explicit Save-only semantics remain unchanged. Physical PASS is not inferred.

Alpha.76 Selection-based single-object Move is implemented at
`ALPHA76_SELECTION_OBJECT_MOVE_IPHONE_IPAD_QA_REQUIRED`, pending Owner physical iPhone and iPad-mini QA. With
`선택` active, pointer-down uses the existing reverse-order WORLD hit-test, immediately selects the topmost object,
and captures one viewport-generation-owned move session. Movement below the shared screen-space spacing token is a
selection-only no-op; movement beyond it inverse-projects the live pointer and renders one derived replacement Scene
whose outline follows the object without duplicating the original. Release translates freehand, line, arrow,
rectangle, ellipse, or text while preserving id/kind/order/style/content and commits exactly one local Scene/history
entry. Undo/Redo retain the same selected id while it exists. Scene-v1 persisted-coordinate bounds constrain only the
whole translation delta, so geometry is never distorted. Cancel, tool switch, close, viewport invalidation, or missing
selection clears preview with mutation `0`. Network persistence remains explicit Save-only; Move/Resize/Rotate,
handles, endpoint editing, multi-select, zoom/pan, schema/API/migration, dependency/native/config/EAS, orientation,
version, and Production gate remain unchanged. Physical PASS is not inferred.

Alpha.75 is finalized at `ALPHA75_FINALIZATION_COMPLETE` with product checkpoint `ALPHA75_COMPLETE`. Owner actual
physical QA is `PASS` on iPhone and iPad mini for the complete overlay drawing palette, Selection/Delete, partial stroke
Eraser, eraser feedback, Undo/Redo, portrait continuity, and Save/close/reopen persistence. Each device used at most one
alpha.75 Save, and iPad-mini orientation regression is `0`. Regular/Large iPad and Android actual-device QA remain
`NOT_RUN`; they are neither inferred PASS nor alpha.75 finalization blockers. APP_VERSION is `2.0.0-alpha.75`.
Finalization adds no product behavior, API/schema/migration, dependency/native/config/EAS, Production/Owner/ambiguous
business mutation, tag, or release. Scene schema v1, migration `22/22`, and Production `스케치(준비 중)` remain.

Alpha.75 Overlay Drawing Palette + Stroke Partial Eraser is implemented at
`ALPHA75_OVERLAY_PALETTE_STROKE_ERASER_IPHONE_IPAD_QA_REQUIRED`, pending Owner physical iPhone and iPad-mini QA.
The current drawing-tool selector now opens a vertically stacked, icon-only absolute overlay; it does not resize the
toolbar/canvas, and its canvas-side dismiss layer consumes the outside tap. Eraser radius is derived as `0.7` of the
shared minimum touch size in screen space and converted once to WORLD radius for each gesture, so its ring and swept
corridor remain identical across viewport scales. Touched freehand, line, arrow shaft/head, unfilled rectangle borders,
and unfilled ellipse borders become deterministic surviving Scene-v1 freehand fragments on release; untouched
semantic vectors remain their original kinds, while text and filled future shapes are immune. Pointer movement remains
transient and one release remains one Scene/history commit with exact semantic Undo and flattened Redo. This explicitly
supersedes the prior freehand-only product Eraser, fixed 12-WORLD-radius product policy, and normal-flow labelled menu.
Scene schema/API/migration `22/22`, dependency/native/config/EAS, orientation, version, and Production gate remain
unchanged. Physical PASS is not inferred.

Alpha.75 Partial Eraser + Compact Sketch Toolbar is implemented at
`ALPHA75_PARTIAL_ERASER_COMPACT_TOOLBAR_IPHONE_IPAD_QA_REQUIRED`, pending Owner physical iPhone and iPad-mini QA.
Selection + Delete remains the sole whole-object deletion path. `지우개` now affects only freehand/Pen geometry: one
pointer trail forms a WORLD-coordinate swept capsule corridor, and release deterministically replaces each touched
stroke with zero, one, or multiple Scene-v1 freehand fragments in one local Scene/history commit. Pointer movement,
the exact-radius ring, and the derived erased-segment preview remain transient with Scene/history/network/persistence
mutation `0/0/0/0`; line, arrow, rectangle, ellipse, and text are immune. The top toolbar is seven icon-only controls,
with the six authoring tools in one current-tool menu and distinct selected-delete/whole-scene-clear actions. This
checkpoint explicitly supersedes the earlier whole-object Eraser and whole-object candidate-highlight semantics while
preserving their accepted Selection/hit-test/Delete evidence. Scene schema v1, API, migration `22/22`, dependencies,
native/config/EAS, orientation, Static Sheet/Keyboard, Production Sketch gate, and APP_VERSION `2.0.0-alpha.74` remain
unchanged. Physical PASS is not inferred.

Alpha.75 Eraser Visual Feedback correction is implemented at
`ALPHA75_ERASER_VISUAL_FEEDBACK_IPHONE_IPAD_REQA_REQUIRED`, pending Owner visual/tactile iPhone and iPad-mini re-QA.
An eraser gesture now projects a thin cursor ring from the canonical WORLD hit tolerance and viewport scale, with the
shared spacing token as only a minimum screen-radius floor. Every unique whole-object candidate remains highlighted by
a derived outline until release/cancel/tool switch; cursor and candidates use the existing non-interactive transient
SVG layer and never enter Scene/history/persistence/network/export. Release still deletes the accumulated whole-object
set in exactly one local Scene/history commit, and one Undo restores its original order. The Owner already physically
accepted Selection/Delete/whole-object Eraser behavior; this checkpoint does not infer the remaining visual PASS and
requires no additional Save. Scene schema v1, API, migration `22/22`, dependencies/native/config/EAS, orientation,
Static Sheet/Keyboard, APP_VERSION `2.0.0-alpha.74`, and Production Sketch gate remain unchanged.

Alpha.75 Selection / Hit-Test / Object Delete / Eraser is implemented at
`ALPHA75_SELECTION_HITTEST_OBJECT_ERASER_IPHONE_IPAD_QA_REQUIRED`, pending Owner physical iPhone and iPad-mini QA.
Product Sketch exposes `선택` and whole-object `지우개` beside the finalized six alpha.74 tools. One pure
WORLD-coordinate owner hit-tests freehand, line, arrow shaft/head, unfilled shape borders, and deterministic text
bounds; Scene reverse order owns topmost selection. Selected-id, outline, and eraser candidates remain transient.
Selected Delete and each completed multi-object eraser gesture create exactly one local Scene/history commit; no
network write occurs before explicit Save, and Undo restores original object order. Scene schema v1, Drawing API,
migration `22/22`, orientation/native policy, Static Sheet/Keyboard, APP_VERSION `2.0.0-alpha.74`, and Production
`스케치(준비 중)` remain unchanged. Automated evidence does not infer physical PASS.

Alpha.74 is finalized at `ALPHA74_FINALIZATION_COMPLETE` with product checkpoint `ALPHA74_COMPLETE`. Owner actual
physical QA is `PASS` on iPhone and iPad mini: general WAFL and Product Sketch remain portrait-only; iPad-mini content,
native outer-frame/black-diamond rotation motion, rotation bounce, and split-layout flash are all `0`; Recipe/tab and
Sketch continuity pass. Pen, line, arrow, rectangle, ellipse, touch/render alignment, mixed Undo/Redo, and explicit
Save/close/reopen of the editable WORLD Scene pass, with exactly one iPad Save and no finalization Save. Regular/Large
iPad actual-device QA and Android phone/tablet actual-device QA remain `NOT_RUN` and are not blockers or inferred PASS.
Scene schema v1, migration `22/22`, Production `스케치(준비 중)`, and the retained DEV QA Recipe remain unchanged.
APP_VERSION is `2.0.0-alpha.74`; finalization adds no feature, API/schema, migration, dependency/native/config/EAS,
Production/Owner/ambiguous business mutation, tag, or release.

Alpha.74 iOS Compact Native app/window orientation-mask correction is implemented at
`ALPHA74_IOS_COMPACT_NATIVE_ORIENTATION_MASK_QA_REQUIRED`, pending Owner physical QA on fresh development build
`90ec13f2…1a69c`. Actual iPad-mini video after root Stack and stable responsive-class correction proved that WAFL/Recipe/Sketch
content remained portrait and the split flash was gone, while the outer iOS window still attempted a black-frame/
diamond rotation bounce. Expo SDK55 source proves `ExpoAppDelegate.application(_:supportedInterfaceOrientationsFor:)`
owns the top mask through subscriber intersection. The reproducible orientation config plugin now generates an
app-specific AppDelegate override: iPhone and iPad whose logical screen short side is below the shared `768` regular-
tablet boundary return `.portrait`; regular/large iPad delegates to `super`, preserving Info.plist landscape,
native-stack, and `expo-screen-orientation` behavior. No model/hardware table or React/Drawing change is used. Root
native-stack, Product Sketch portrait scope, stable responsive detail host, broad iPad orientation metadata,
`UIRequiresFullScreen`, Android behavior, Drawing WORLD/Scene/API, migration `22/22`, and APP_VERSION
`2.0.0-alpha.73` remain preserved. The existing-project `development`/internal EAS build finished after all gates with
no credential, Team, bundle, or device change. Physical zero-motion PASS is not inferred.

Alpha.74 Compact Tablet zero-rotation-motion correction is implemented at
`ALPHA74_COMPACT_TABLET_ZERO_ROTATION_MOTION_REQA_REQUIRED`. Owner actual iPad-mini evidence on the fullscreen-enabled
Development Build showed final portrait restoration but a visible rotate/bounce and transient Recipe split layout. LIVE
source proved two wiring gaps: the existing `resolveWaflRootStackOrientation` policy did not reach the Expo Router native
Stack, and `MobileWorkOrderExperience` still selected split presentation from transient window width alone. The root
Stack now consumes the installed native-stack `portrait_up/default` option, while one provider-owned stable
`WaflMobileDeviceClass` feeds a pure responsive-presentation policy. Handset/compact tablet remain phone-like regardless
of swapped dimensions; regular tablet remains tablet-eligible, and the stable `work-order-responsive-detail-host`
identity is preserved. Runtime orientation reconciliation, Product Sketch portrait scope/Modal, `requireFullScreen`,
generated `UIRequiresFullScreen`, supported orientation arrays, Drawing WORLD/Scene/API, dependencies, native/config/EAS,
migration `22/22`, and APP_VERSION `2.0.0-alpha.73` remain unchanged. The installed build is reused; EAS build/re-sign/
reinstall are `0/0/0`. Owner physical no-motion PASS is not inferred.

Alpha.74 iOS fullscreen orientation native prerequisite is implemented at
`ALPHA74_IOS_FULLSCREEN_ORIENTATION_NATIVE_BUILD_QA_REQUIRED`. Canonical Expo iOS config now declares
`requireFullScreen: true`, and Expo SDK55 introspection proves the generated Info.plist owns
`UIRequiresFullScreen: true`. This intentionally disables iPad Split View and Slide Over so the existing runtime
orientation owner can enforce compact-tablet and Product Sketch portrait locks. The iPhone native array remains
portrait-only; the iPad native array remains portrait, upside-down, and both landscape orientations so regular/large
tablet base WAFL retains portrait+landscape. The compact/regular runtime classifier, Product Sketch portrait scope,
stable responsive Recipe detail host, Drawing WORLD model, dependencies, API/schema, migration `22/22`, and APP_VERSION
`2.0.0-alpha.73` remain unchanged. Existing-project internal iOS Development Build
`035dd0f3…bebef` finished successfully with the pinned EAS CLI `21.0.1`, `development` profile,
internal distribution, public version `2.0.0`, and build number `1`. Owner installation and physical QA remain required;
physical PASS is not inferred.

Alpha.74 compact-tablet and Product Sketch portrait policy is implemented at
`ALPHA74_COMPACT_TABLET_SKETCH_PORTRAIT_POLICY_QA_REQUIRED`. One framework-free orientation owner now classifies
`handset`, `compact-tablet`, and `regular-tablet` from the orientation-invariant physical-screen short side while retaining
the native iOS tablet idiom and Android 600dp tablet boundary. The existing canonical 768 responsive threshold is shared
as the regular-tablet product boundary. Phone and compact tablet use `PORTRAIT_UP`; regular tablet base WAFL remains
unlocked. Product Sketch acquires one declarative portrait-only runtime scope on every mobile class and releases it on
close, restoring the base device policy without forcing landscape. Its fullscreen Modal now declares portrait only.
Native/config/EAS, Drawing WORLD/viewport/Scene/API, stable responsive detail host, migration 22/22, and APP_VERSION
`2.0.0-alpha.73` remain unchanged. iPhone/iPad-mini Owner QA and regular/large-tablet future physical QA are not inferred.

Alpha.74 iPad responsive Recipe-detail subtree continuity correction is implemented at
`ALPHA74_IPAD_RESPONSIVE_DETAIL_CONTINUITY_REQA_REQUIRED`. Owner physical evidence after the first Sketch Modal
orientation correction still showed Product Sketch closing on both iPad portrait→landscape and landscape→portrait,
with no active gesture and no iPad Save. LIVE source proved that the responsive branch moved the selected detail from a
tablet second-child wrapper to a phone first-child direct subtree, remounting `WorkOrderDetailOverview`, its selected
tab, `WorkOrderImageGallery`, and local `sketchVisible`. One stable responsive workspace now keeps a keyed selected-detail
host under the same parent while layout/list visibility changes. The existing breakpoint, Sketch supported orientations,
iPhone portrait policy, tablet rotation, Drawing WORLD/viewport/Scene/API, dependencies, native/config/EAS, and migration
22/22 remain unchanged. APP_VERSION is `2.0.0-alpha.73`; Owner iPad physical PASS is not inferred.

Alpha.74 iPad Product Sketch fullscreen orientation lifecycle correction is implemented at
`ALPHA74_IPAD_SKETCH_ORIENTATION_LIFECYCLE_REQA_REQUIRED`. Owner physical evidence accepted iPhone portrait as PASS with
its single Save consumed, while both iPad portrait→landscape and landscape→portrait closed the fullscreen Sketch before
any iPad Save. The Product Sketch-local React Native fullscreen Modal now explicitly declares portrait,
portrait-upside-down, landscape-left, and landscape-right, matching the existing iPad native/runtime allowance while the
iPhone native/runtime policy remains portrait-only. The exact native dismissal callback is not inferred. Drawing WORLD
geometry, viewport recompute/stale-gesture cancellation, Scene/API/schema, other fullscreen surfaces, dependencies,
native/config/EAS, and migration 22/22 are unchanged. APP_VERSION remains `2.0.0-alpha.73`; iPad re-QA is required.

Alpha.74 responsive Product Sketch shape authoring is implemented at
`ALPHA74_SKETCH_RESPONSIVE_SHAPE_AUTHORING_IPHONE_IPAD_QA_REQUIRED`. The authenticated DEV/TEST Product Sketch toolbar
adds `사각형` and `타원` to the finalized pen/line/arrow/text set. One renderer-independent bounded-shape session owns
WORLD start/end points, canvas clamping, direction-independent bounds, transient preview, minimum WORLD size, and one
release Scene/history commit. A Drawing-local viewport generation cancels any in-flight pen/line/arrow/rectangle/ellipse
gesture, or a not-yet-presented text tap, when canvas layout changes; a presented text session retains its immutable WORLD
anchor. Scene schema v1, Drawing API/persistence, WaflInputSheet, dependencies, native/config/EAS, and migration 22/22 are
unchanged. APP_VERSION remains `2.0.0-alpha.73`; Owner iPhone/iPad physical PASS is not inferred.

Alpha.73 is finalized at `ALPHA73_FINALIZATION_COMPLETE` with product checkpoint `ALPHA73_COMPLETE`. The Owner's
actual-iPhone statement `다 잘된다. 이제 키보드는 다 되는거같다` is recorded as `OWNER_IPHONE_PHYSICAL_PASS` only for
the cumulative A73D Keyboard / Static Sheet gate; it supersedes the intermediate failures in that stabilization chain
without extending to unrelated features or inventing cycle counts. Earlier retained Owner evidence separately accepts
the Product Sketch pen/line/arrow/text tools, mixed Undo/Redo, explicit Save/reopen, and safe dirty discard. Static Sheet
root drag/free-settle/user detent/drag-dismiss remain retired, while body/Reel scrolling, one ephemeral keyboard reveal
transaction, nested ownership, numeric X/V, and exact static restore remain canonical. Address Search provider-result
physical execution was unavailable; only its alpha.73 generation/crash/Search guards are accepted by automated contract.
DEV/TEST migration is `22/22`; Production migration and Production/Owner/ambiguous business mutation are `0/0/0/0`.
APP_VERSION is `2.0.0-alpha.73`; finalization adds no product behavior, dependency, native/config/EAS, API/schema,
migration, or data mutation.

Alpha.73D Quick phone return-key opt-out is implemented at
`ALPHA73D_QUICK_PHONE_RETURN_KEY_OPT_OUT_FIX_IPHONE_QA_REQUIRED`. `WaflSheetValueField` now exposes the existing typed
`waflReturnKeyPolicy` as a bounded pass-through with the unchanged `auto` default. Only the Quick driver-contact and
nested address-contact phone-pad fields select `none`, so WAFL requests neither a return-key type nor a keyboard-submit
owner for those fields. Their PHONE_NUMBER class, phone-pad, accessory opt-out, semantic scope, registered handoff,
nested topmost owner, and Sheet X/V remain unchanged. Search, ordinary text Next/Done, numeric direct, and every other
phone-pad callsite retain their prior policy. Canonical inventory is `264/264`; APP_VERSION remains
`2.0.0-alpha.72`, and Owner physical PASS is not inferred.

Alpha.73D Quick phone accessory geometry correction is implemented at
`ALPHA73D_QUICK_PHONE_ACCESSORY_GEOMETRY_FIX_IPHONE_QA_REQUIRED`. `WaflSheetValueField` now exposes the existing typed
`waflKeyboardAccessory` policy as a bounded pass-through to `WaflSheetTextInput`, retaining `auto` by default. Only the
Quick driver-contact and nested address-contact phone-pad fields opt out with `none`, so they no longer attach the shared
52-point iOS InputAccessoryView; their PHONE_NUMBER class, phone-pad keyboard, completion/return semantics, semantic
scope, registered handoff, nested topmost owner, and Sheet X/V remain unchanged. Other phone/number inputs retain the
canonical automatic minimal accessory policy, while numeric direct input keeps its existing explicit opt-out. Canonical
inventory is `263/263`; APP_VERSION remains `2.0.0-alpha.72`, and Owner physical PASS is not inferred.

Alpha.73D nested keyboard ownership, prepared-geometry recapture, and numeric opening-value display correction is
implemented at `ALPHA73D_NESTED_KEYBOARD_OWNER_PREPARED_RECAPTURE_AND_NUMERIC_DISPLAY_FIX_IPHONE_QA_REQUIRED`.
One process-local presentation registry now grants global React Native keyboard-event geometry ownership only to the
topmost rendered direct-input Sheet, so a nested Address Direct keyboard cannot change the underlying Quick main inset,
root, body, or padding geometry. Prepared geometry revisions now represent structural layout only; runtime keyboard
padding, viewport, and scroll metrics retain their live authority without invalidating the prepared snapshot. A genuine
structural update may perform a capture-only refresh while the keyboard is open, with root/body mutation `0/0`. Numeric
`기존값` trims display-only trailing decimal zeroes while preserving the session-opening raw value. Canonical inventory is
`262/262`; APP_VERSION remains `2.0.0-alpha.72`, and Owner physical PASS is not inferred.

Alpha.73D live-root baseline, residual-scroll, and numeric return-key correction is implemented at
`ALPHA73D_LIVE_ROOT_BASELINE_RESIDUAL_SCROLL_AND_NUMERIC_RETURN_KEY_FIX_IPHONE_QA_REQUIRED`. Root-first keyboard
planning now separates static hide/restore bounds from the current `systemKeyboard` root target, so registered field
handoffs do not invent body scroll for reveal already supplied by the raised Sheet. Residual body scroll resolves actual
top/bottom clipping only; the keyboard semantic gap remains a bottom clearance and is no longer duplicated as a cosmetic
top margin. Numeric direct input opts out of both WAFL accessory and WAFL return-key completion semantics while retaining
its inline X/V owner. DEV/external-QA evidence now includes Quick main, Address Direct, and numeric-direct surfaces.
Canonical inventory is `261/261`; APP_VERSION remains `2.0.0-alpha.72`, and Owner physical PASS is not inferred.

Alpha.73D live body-scroll authority and numeric mode-transition correction is implemented at
`ALPHA73D_LIVE_BODY_SCROLL_AUTHORITY_AND_NUMERIC_MODE_TRANSITION_FIX_IPHONE_QA_REQUIRED`. Prepared direct-input
snapshots keep structural geometry only; every reveal plan now reads the current live body offset and applies a signed,
bounded system delta. Independent focus appearances reset their baseline/system delta, while an explicitly matched
registered-input handoff alone transfers continuity. Final direct-input reconciliation cannot start a late animated body
scroll. Reel-to-numeric mode change is one prepared focus transaction: the static root does not settle at an intermediate
numeric state, focus waits for current measurements, and the first keyboard frame owns the single coordinated reveal.
Numeric direct input uses its inline X/V actions without an iOS accessory; Quick Delivery phone-pad retains its single
completion accessory. APP_VERSION remains `2.0.0-alpha.72`; API/schema/migration/dependency/native/config/EAS and
business data are unchanged, and Owner physical PASS is not inferred.

Alpha.73D Quick root-first reveal and numeric direct-input UI correction is implemented at
`ALPHA73D_QUICK_ROOT_FIRST_REVEAL_AND_NUMERIC_DIRECT_INPUT_UI_FIX_IPHONE_QA_REQUIRED`. Quick driver, direct-address,
and address-search inputs opt into one shared root-first prepared transaction: the static root satisfies the legal
semantic reveal first and only the remaining content depth becomes non-animated body scroll in that same appearance.
An explicit semantic scope cannot start a reveal claim until its canonical body-content rectangle is ready; raw
parent-local layout is never fallback authority. Numeric keypad mode now uses `keyboardMode="directInput"` and the
prepared-focus lifecycle, with a single inline `WAFL PICK으로 변경` + shared X/V row and no redundant footer. Its fixed
40-point status area preserves the session-opening `기존값` while independently showing validation, producing a
deterministic 200-point direct body extent. The existing Reel mode, one-root-per-appearance owner, registered handoff,
New Recipe, Spec Save, and Drawing behavior remain unchanged. APP_VERSION remains `2.0.0-alpha.72`; API/schema/migration/
dependency/native/config/EAS and business data are unchanged, and Owner physical PASS is not inferred.

Alpha.73D semantic-coordinate normalization, Quick Delivery reveal, and numeric keypad composition are implemented at
`ALPHA73D_SEMANTIC_COORDINATE_NORMALIZATION_QUICK_REVEAL_AND_NUMERIC_KEYPAD_FIX_IPHONE_QA_REQUIRED`. Semantic focus
blocks now normalize native geometry against the canonical Sheet body-content ancestor before publishing a prepared
keyboard target; immediate-parent coordinates remain diagnostic evidence only. Nested Quick driver/address fields can
therefore derive current body-scroll and root targets in the same keyboard appearance transaction, whose normal prepared
body scroll is non-animated. Numeric keypad mode declares input, the fixed 20-point auxiliary slot, and the mode-switch
row as one semantic region, while Reel deterministic extent now includes the shared body end gap. Root animation ownership,
registered-input handoff, and single visible reveal remain unchanged. APP_VERSION remains `2.0.0-alpha.72`; API/schema/
migration/dependency/native/config/EAS and business data are unchanged, and Owner physical PASS is not inferred.

Alpha.73D registered-input handoff, Quick Delivery semantic targeting, and numeric Reel stability are implemented at
`ALPHA73D_REGISTERED_INPUT_HANDOFF_QUICK_DELIVERY_AND_NUMERIC_REEL_STABILITY_FIX_IPHONE_QA_REQUIRED`. A body touch on a
second mounted registered input is now classified from its native registry identity and bypasses the generic non-input
blur/`Keyboard.dismiss()` path. The focus generation transfers directly to the destination TEXT or PHONE_NUMBER target;
true non-input body taps still dismiss. Quick driver name/contact/memo and address detail/contact fields each declare a
current explicit semantic region using the shared 12-point gap. Quantity Reel/keypad modes reserve one fixed 20-point
validation/legacy/empty status slot, so value and status changes cannot resize the static root; only an actual mode change
selects another deterministic extent. The prior root-animation owners, single visible reveal, static restore, and Direct
Color behavior are unchanged. APP_VERSION remains `2.0.0-alpha.72`; API/schema/migration/dependency/native/config/EAS and
business data are unchanged, and Owner physical PASS is not inferred.

Alpha.73D root-animation ownership and reusable Direct Create semantic-target correction is implemented at
`ALPHA73D_ROOT_ANIMATION_OWNERSHIP_AND_DIRECT_CREATE_SEMANTIC_TARGET_FIX_IPHONE_QA_REQUIRED`. Actual-device
JSONL proved an active `staticRest` restore could continue natively after a fresh keyboard appearance while the
JavaScript translated completion already equalled the requested keyboard target. That stale equality was treated
as no requested root animation, so restore pulled the Sheet down and did-show later authored the visible recovery
rise. The shared owner now tracks generation-scoped `entrance` / `staticRest` / `systemKeyboard` / `exit` motion,
supersedes an incompatible restore before resolving a keyboard target, and distinguishes an explicit completed
`trueNoop` from an unresolved appearance. Direct Size and Direct Spec/POM create forms now declare only their
field plus helper as the explicit semantic region; Direct Color palette content remains outside it. The one visible
root writer and shared 12-point semantic gap remain canonical. APP_VERSION remains `2.0.0-alpha.72`; API/schema/
migration/dependency/native/config/EAS and business data are unchanged, and Owner physical PASS is not inferred.

Alpha.73D keyboard focus-ordering and semantic-clearance correction is implemented at
`ALPHA73D_KEYBOARD_FOCUS_ORDERING_AND_SEMANTIC_CLEARANCE_FIX_IPHONE_QA_REQUIRED`. Actual-device evidence
showed an iOS native keyboard will-event can arrive before React Native installs the focused target. The
shared `WaflInputSheet` now retains that frame only as an ephemeral, non-authoring candidate and consumes it
at the matching current focus generation using the existing keyboard transition and single appearance root
claim. Stale open/layout/measurement/sheet or keyboard-class candidates move neither body nor root. Explicit
semantic scopes use the shared 12-point semantic gap rather than the broader generic focus context; New
Recipe therefore keeps the full character-choice row visible without the former oversized clearance. Spec
Save new mode explicitly scopes its name and mode buttons as one required semantic region. APP_VERSION is
still `2.0.0-alpha.72`; API/schema/migration/dependency/native/config/EAS and business data are unchanged,
and Owner physical PASS is not inferred.

Alpha.73D New Recipe actual-device final-geometry evidence instrumentation is implemented at
`ALPHA73D_NEW_RECIPE_ACTUAL_DEVICE_FINAL_GEOMETRY_EVIDENCE_IPHONE_QA_REQUIRED`. This checkpoint changes
no Sheet/keyboard target, root-claim transaction, body-scroll policy, input behavior, or product layout.
The `new-recipe` and `spec-save-new` reference surfaces now opt into a DEV + external-QA-only ordered
diagnostic stream. It records native keyboard events, requested target/claim evidence, body offset, and
post-frame actual native window rectangles for the Sheet, viewport, input, semantic scope, and New Recipe
work-character choice region. The local server persists sanitized JSONL under ignored `.tmp` storage after
exact external-QA and authenticated developer guards. No DB/R2/business or Production mutation is involved.
APP_VERSION remains `2.0.0-alpha.72`; Owner iPhone evidence is still required before a root-cause or product
fix conclusion, and physical PASS is not inferred.

Alpha.73D Spec Save motion-reference/layout normalization is implemented at
`ALPHA73D_SPEC_SAVE_MOTION_REFERENCE_LAYOUT_NORMALIZATION_IPHONE_QA_REQUIRED`. Spec Save and New Recipe
continue through the same `WaflInputSheet` direct-input focus, keyboard appearance, single root-claim,
keyboard-timed animation, and static hide-restore owners. Their final Y targets remain surface-specific:
Spec Save uses the minimal name-field semantic block, while New Recipe retains its explicit product/helper/
work-character scope. In new-save mode the name input now precedes the mode selector; update mode keeps the
selector before the potentially long template list. No local animation, offset, timeout, dependency, API,
schema, migration, native/config/EAS, or data mutation was added. APP_VERSION remains `2.0.0-alpha.72` and
Owner physical PASS is not inferred.

Alpha.73D compact semantic target formula correction is implemented at
`ALPHA73D_COMPACT_SEMANTIC_TARGET_FORMULA_UNDER_REVEAL_IPHONE_REQA_REQUIRED`. Current New Recipe
evidence (`393x852`) resolves window/expanded/static-rest/keyboard to `852/801/523/308`, header/body to
`48/180`, and the explicit semantic scope to `y=0, height=168`. The canonical prepared target is `197`,
placing the complete work-character row at window `472` with `72` points of keyboard clearance. The
previous measured/floor path could settle at `268`, effectively placing the row on the keyboard boundary,
because the stricter explicit semantic prepared target was not preserved through the downstream merge.
Explicit semantic regions now own their required compact bottom even without a common footer, and the
current prepared target is merged as a stricter bound before the appearance's one root claim. Ordinary
compact fields still ignore unrelated body content. Single-root, warm fast path, static restore, and zero-
drift contracts remain. APP_VERSION stays `2.0.0-alpha.72`; API/schema/migration/dependency/native/config/
EAS and data are unchanged. Owner physical PASS is not inferred.

Alpha.73D cold-start semantic-scope registration replay is implemented at
`ALPHA73D_COLD_START_SEMANTIC_SCOPE_REGISTRATION_REPLAY_IPHONE_REQA_REQUIRED`. The first native layout of a
`WaflSheetSemanticFocusScope` could precede the input's passive subscription: the scope stored its full rectangle, but no
listener received it, and later subscription did not replay the stored value. The direct-input registry could therefore
remain null/incomplete for the first New Recipe focus even though the scope already contained product name, helper, work
character, and both character buttons. Inputs now install the layout listener in a layout-synchronous lifecycle and then
immediately replay the current stored layout. Same geometry is a no-op; new geometry increments registry/geometry revisions
and invalidates older prepared snapshots. Fast-path trust additionally requires registry == current scope == prepared rect,
so missing/stale semantic geometry authors neither body nor root and consumes no appearance claim. Single-root, warm fast
path, static hide restore, and zero-drift contracts remain. APP_VERSION remains `2.0.0-alpha.72`; API/schema/migration,
dependency/native/config/EAS, data, and release state are unchanged. Owner cold-start physical PASS is not inferred.

Alpha.73D cold-start first-focus geometry freshness correction is implemented at
`ALPHA73D_COLD_START_FIRST_FOCUS_GEOMETRY_FRESHNESS_IPHONE_REQA_REQUIRED`. The latency fast path previously treated an
unchanged presentation/measurement identity as sufficient even when cold-start body, header, footer, semantic-scope, or
direct-input registry geometry had changed after snapshot capture. The shared owner now captures an explicit target-
geometry revision, registry revision, measured chrome/body dimensions, semantic target rectangle, completion state, and
capture time. Any target-relevant change invalidates the prepared snapshot before body scroll, root mutation, or root-slot
claim. Current complete geometry keeps the existing transition-synchronous warm fast path; otherwise final did-show
measurement may consume the still-unused appearance slot exactly once. New Recipe's product field and work-character row
remain one semantic scope. The single-visible-root, derived static-rest, class-transition, and zero-drift invariants remain
unchanged. APP_VERSION remains `2.0.0-alpha.72`; API/schema/migration/dependency/native/config/EAS and data are unchanged.
Owner cold-start physical PASS is not inferred.

Alpha.73D keyboard-reveal latency correction is implemented at
`ALPHA73D_KEYBOARD_REVEAL_LATENCY_EVIDENCE_SAFE_FAST_PATH_IPHONE_REQA_REQUIRED`. Owner physical evidence after Phase 3
accepted correctness but identified a perceptible delay between keyboard motion and the Static Sheet root reveal. The
root cause was the combination of an early `keyboardWillChangeFrame` event that policy could not authorize and a late
`keyboardDidShow` fallback that waited through asynchronous measurement/reconciliation. The shared owner now classifies
native transition trust from current open/focus/measurement/layout/keyboard-class identity and final anchored frame
geometry. A trustworthy iOS will-show or will-change frame may claim the appearance's single root slot and synchronously
start the existing keyboard-timed body-scroll/root target; provisional, stale, unanchored, class-mismatched, or React state
events cannot. If no safe early event exists, measured did-show retains the one fallback claim. Same-appearance later
events remain assertion/body-only, so correctness, `SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE`, derived static
rest, hide restore, and zero drift are unchanged. DEV/external-QA structured monotonic evidence records event, trust,
schedule, animation start, fallback, and restore without a product overlay or fabricated timing. APP_VERSION remains
`2.0.0-alpha.72`; API/schema/migration/dependency/native/config/EAS and data are unchanged. Physical PASS is not inferred.

Alpha.73D Phase 3 remaining-surface cleanup is implemented at
`ALPHA73D_PHASE3_STATIC_SHEET_REMAINING_SURFACES_CLEANUP_IPHONE_QA_REQUIRED`. LIVE presentation recount is
`WaflInputSheet 26 / Reel 8 / paired Reel 1 / Decision 3 / calendar 1 / raw Modal 7`; the source-owned logical matrix
classifies 44 surfaces as Static compact `7`, Static scrollable `17`, Static Reel `9`, Decision candidate `5`, fullscreen
keep `5`, and special fixed Modal `1`. Common-root PanResponder, handle/zone, free-settle, user detent, drag-dismiss,
user-authored Y, and drag-only accessibility owners remain zero. Static extent token names replace the last live detent
ratio names without changing values; the sizing value union and `waflSheetDetentPolicy.ts` filename remain import/API
compatibility only. Due-date child cancel, Decision presentation, fullscreen gestures, footer/exactly-once, nested generation,
and Phase 2 keyboard appearance ownership remain unchanged. Owner-reported Phase 2 iPhone checks are PASS; the slight
keyboard response delay is a non-blocking observation. Phase 3 physical PASS is not inferred. Subject to Phase 3 Owner
iPhone spot checks, the automated architecture state is `FINALIZATION_READY`; no finalization action is authorized here.

Alpha.73D Phase 2 New Recipe keyboard-appearance single-reveal correction is implemented at
`ALPHA73D_PHASE2_NEW_RECIPE_KEYBOARD_APPEARANCE_SINGLE_REVEAL_IPHONE_REQA_REQUIRED`. The prior exact-frame blocker
checkpoint physically failed because one iOS keyboard appearance may publish multiple distinct native frames. The Phase 1
non-draggable common root remains intact.
One current derived `mediumOffset` is the static resting authority; keyboard/focus may request only a bounded ephemeral
absolute system target and can never commit or capture a new rest. Draggable-era `settledOffsetRef`, pre-keyboard root
snapshots, focus-cycle `rootBaselineOffset`, and animation-default rest mutation are retired. Keyboard hide and intentional
blur restore the current derived static rest, while focus-cycle state preserves only body baseline/system/user deltas.
Body reveal remains actual-capacity-first and uses target replacement, semantic keyboard-class changes still wait for the
fresh incoming frame, and did-show reconciliation remains generation-guarded. `SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE`
scopes visible root authorship to one explicit open/focus/measurement/semantic-class/appearance generation; mutable frame
geometry is target evidence and cannot mint another slot. On iOS initial hidden-to-visible presentation, `keyboardWillShow`
is the transition-synchronized scheduling owner, while intermediate `willChangeFrame`, React inset synchronization, and
same-appearance `didShow` are body/evidence/assertion-only after the one root claim. If no earlier stable root target exists,
final did-show measurement may own the still-unused appearance slot. Same-field layout refresh does not create a new focus or
appearance generation. Footer X/V, backdrop/back cancel, processing,
exactly-once actions, nested close-generation semantics, Reel/content gestures, and explicit fullscreen exceptions are
unchanged. APP_VERSION stays `2.0.0-alpha.72`, migration remains 22/22, API/schema/dependency/native/config/EAS and data
remain unchanged, and physical PASS is not inferred.

Alpha.73C Phase 4 is the current candidate at
`ALPHA73C_PHASE4_COMPACT_REVEAL_KEYBOARD_CLASS_TRANSITION_IPHONE_REQA_REQUIRED`. It retains Phase 3 Overview child-state,
taxonomy, manual-focus, semantic-scope, and root/body restore ownership. Compact direct-input planning now uses the measured
semantic focus target as its primary minimum reveal; unrelated compact body content no longer forces whole-composition root
rise, while a real persistent footer remains a safety requirement. Focus cycles explicitly distinguish active, dismissing,
transferring, and terminated state. In-session system body compensation is an absolute target replacement rather than an
additive delta. The shared registry owns TEXT, PHONE_NUMBER, MULTILINE, and SEARCH keyboard classes; a class switch cannot
reveal with the old keyboard frame and waits for the incoming frame before one target calculation. Phase 3 PASS surfaces,
Address Search automated guards, Reel, Drawing Scene/history/network/persistence, API/schema, migration 22/22, dependencies,
native/config/EAS, and Production data remain unchanged. APP_VERSION stays `2.0.0-alpha.72`; physical PASS is not inferred.

Alpha.73 is an owner-approved DEV/TEST product-sketch candidate at
`ALPHA73_DIRECT_INPUT_DIDSHOW_MICRO_RECONCILIATION_IPHONE_REQA_REQUIRED`. It reuses the finalized alpha.72
`1000 × 1400` Scene v1, SVG renderer, midpoint-quadratic display path, raw world points, transient active stroke,
and bounded history. Authenticated development builds expose the exact `스케치` entry for editable Draft Recipes;
release/production continues to show disabled `스케치(준비 중)`. The first vertical slice supports freehand,
Undo, Redo, local Clear, explicit Save, dirty-exit Decision, and editable reopen. Persistence is revision-owned in
`work_order_drawings`, uses an independent optimistic Drawing version and idempotent command receipt, and does not
increment the WorkOrder version. Migration 022 was applied only to canonical DEV/TEST; Production migration and
production/Owner/ambiguous mutation remain zero. No derivative, R2, image, PDF, Viewer, Share, or export integration is
introduced. The alpha.73A-1 correction removes the unreliable header X and routes the PDF Viewer-pattern bottom `닫기`,
Android back, and modal dismiss request through one dirty-aware close owner; explicit `저장` remains the only persistence
action. APP_VERSION remains `2.0.0-alpha.72`; physical PASS is not inferred.
The alpha.73A-2 correction makes the nested dirty Decision finish its own sheet/Modal close lifecycle before resolving
confirmed discard onto the same one-shot parent-close owner as clean close. This prevents a retained native backdrop or
black frame without resetting or saving the persisted Scene.
The alpha.73B continuation exposes exactly `펜 / 선 / 화살표 / 텍스트` as the first apparel-annotation tool set. Pen
preserves the accepted freehand path. Line and arrow keep transient WORLD endpoints outside committed Scene/history until
one release commit; arrowhead geometry remains renderer-derived. Text uses the canonical WAFL direct-input sheet and commits
one semantic WORLD anchor/content/font-size element only after the child sheet finishes closing. Drawing Scene v1 gains the
`text` element kind additively, so legacy v1 rows remain readable and migration 022 remains unchanged. Rectangle, ellipse,
eraser, selection, movement, resize, image underlay, PDF, and export remain outside this Delta. Physical PASS is not inferred.
The alpha.73B-1 correction removes the Sketch text field's raw mount-time autofocus. Each canvas tap creates one WORLD-
anchored session, and the input requests focus exactly once only after the shared Sheet finishes its entrance and calls
`onAfterOpen`. A renderer-only crosshair and ghost text project from that same WORLD anchor while typing; they never enter
Scene, history, persistence, or network state. Confirm uses the identical stored anchor, cancel/tool change removes the
transient session, and stale presentation callbacks cannot focus a closed or replacement session.
The alpha.73B-2 correction keeps that presentation-before-focus safety while removing the unconditional direct-input
keyboard detent. The shared mounted semantic-block reveal owner scrolls first and applies only any remaining minimum sheet
rise, synchronized to the native keyboard frame transition when iOS supplies its duration/easing. Already-visible fields
therefore do not move the sheet a second time. Keyboard hide still restores the pre-keyboard settled offset unless user drag
owns the new geometry. Sketch text replaces the transient brick-orange crosshair with one compact neutral vertical caret;
the immutable WORLD anchor, ghost/final equality, Scene/history/network zero-mutation preview, and A73A2 close lifecycle stay unchanged.
The alpha.73B-3 physical correction adds a theme-owned minimum keyboard visibility floor without restoring the removed
intrinsic-body detent. The final keyboard frame merges that floor with mounted semantic-block reveal into one target and
bounds body scroll by actual forward capacity. `keyboardDidShow` explicitly remeasures the current open/focus/measurement
generation once even when the inset value is unchanged; invalid transient measurements still apply the floor instead of
ending at scroll-only fallback. An already-correct final geometry produces no reconciliation movement. The B2 neutral WORLD
caret and B1 presentation-before-focus order remain unchanged; physical PASS is not inferred.
The alpha.73B-4 continuation changes only intentional auto-focused direct-input opening. Its opt-in prepared boundary waits
for mounted chrome/body measurement and an editable target, keeps the sheet in opening geometry, and requests focus once.
The final keyboard frame then drives the first visible entrance directly to the B3 merged floor/reveal target. Manual
direct-input sheets and all picker/reel sheets retain their ordinary entrance. A bounded two-frame lifecycle fallback opens
normally when focus produces no software-keyboard frame, while a four-point theme spacing tolerance suppresses only a final
didShow settling rise when the field is already visually clear; real occlusion is never waived. The ordinary medium target
remains the hide-restore baseline, close invalidates all prepared callbacks, and physical PASS is not inferred.
The alpha.73B-5 correction strengthens `prepared` from mounted-input readiness to generation-scoped local-geometry
readiness. Each semantic focus block publishes its sheet-local layout before focus; the shared sheet freezes the current
header/body/content/viewport/action/safe-area/sizing geometry and uses the final `keyboardWillChangeFrame` inset to compute
the compact-or-scrollable floor/reveal target synchronously. That target is animated in the same keyboard event turn with
no requestAnimationFrame, window measurement, or Promise boundary. Compact forms include their coherent body/action
composition, while long forms consume prepared forward scroll first and rise only for the residual. Actual-window
`keyboardDidShow` measurement remains a generation-guarded assertion/safety pass; a meaningful correction is a first-target
miss, not normal success. Geometry-unavailable and hardware-keyboard cases retain lifecycle-bounded ordinary opening.
Hide/restore, drag, close, neutral caret, Drawing persistence, and physical-result boundaries remain unchanged.
The alpha.73B-6 correction narrows `keyboardDidShow` to a semantic safety classifier. Actual-window measurement still
runs once for the current open/focus/measurement generation, but a visible focused block and visible compact action/footer
classify any residual native/layout delta as `CLEAR` or `MICRO_SETTLING` and start no whole-sheet animation. The previous
four-point raw-delta branch is replaced by semantic visibility plus the bounded eight-point `spacing.sm` settling evidence
token. Only `REAL_OCCLUSION` consumes actual remaining body-scroll capacity and then raises the sheet for the residual;
coordinated first-target real occlusion is recorded as `FIRST_TARGET_MISS`. Keyboard hide, close, and unmount cancel queued
did-show work. B5 prepared geometry and synchronous first target are unchanged; physical PASS is not inferred.

Alpha.72 Drawing Foundation is finalized at `ALPHA72_FINALIZATION_COMPLETE` with product checkpoint
`ALPHA72_DRAWING_FOUNDATION_COMPLETE` on the finalized alpha.71 baseline.
The Drawing foundation remains one framework-free, renderer-independent `lib/domain/drawing` owner for the fixed
`1000 × 1400` logical world, versioned editable Scene v1, camera/viewport transforms, bounded Scene history, strict
serialization/validation, and library-independent future renderer/editor/export adapter contracts. The continuation adds
an Expo config-plugin native startup layer without changing that foundation: iPhone metadata supports portrait only while
iPad metadata retains portrait and both landscapes; Android MainActivity requests portrait before `super.onCreate(null)`
only when native `smallestScreenWidthDp < 600`, leaving tablets unrestricted. The existing `expo-screen-orientation`
mount/resume owner remains the matching lifecycle safety net. Global Expo orientation stays `default`. Production Drawing UI,
routes, export, WorkOrder/API/R2/PDF integration, schema, migration, and product-data mutation remain zero; the bounded DEV
authoring lab and selected adapter are described below. The Owner has accepted the native iPhone portrait stabilization as physical PASS and selected SVG after
the bounded physical renderer comparison: SVG and Skia felt broadly similar, SVG felt marginally faster at Medium, and neither
showed a clear Heavy advantage. `react-native-svg` is therefore the selected renderer and the temporary Skia dependency,
adapter, reconciler workaround, and dual-renderer toggle are removed. The authenticated development-bundle surface is now one
memory-only SVG performance lab. Its renderer-independent authoring pipeline keeps completed elements in the committed Scene,
keeps the active freehand stroke separately in world coordinates during pointer movement, memoizes the committed projection,
and commits the completed stroke to Scene/history exactly once on release. The continuation keeps those raw world points and
the `1.5` world-unit acceptance threshold unchanged, but renders active and committed freehand with one deterministic
midpoint-quadratic display path. It rejects interpolation and schema changes. The committed SVG subtree is memoized separately
from the active stroke, so pointer movement performs committed projection/path/layer rebuild `0/0/0`. Production keeps the
disabled `스케치(준비 중)` behavior. The Owner explicitly accepted freehand curve fidelity, the bounded Heavy response,
active-stroke committed layer/projection/path counters `0/0/0`, and iPhone portrait zero-twitch as physical PASS. SVG is
the selected renderer. APP_VERSION is `2.0.0-alpha.72`; finalization changes product behavior by zero and alpha.73
production editor work has not started.

Alpha.71 is finalized at `ALPHA71_FINALIZATION_COMPLETE` with product checkpoint `ALPHA71_PRE_DRAWING_COMPLETE`. The release is deliberately pre-Drawing: it preserves the disabled `스케치(준비 중)` affordance and adds no Scene, tool, renderer, gesture, export, or Drawing dependency. The cumulative alpha.71 boundary splits the mobile Media authoring/API ownership without changing behavior and enforces portrait-up on handsets through one SDK55 runtime orientation owner while tablets retain the global default portrait/landscape policy. Owner physical iPhone QA explicitly accepted rotate-after-entry, enter-while-landscape, Photos/Camera, PDF attachment, and Sketch-placeholder checks. APP_VERSION is `2.0.0-alpha.71`; DEV/TEST migration remains `21/21`, Production migration is zero, and production/Owner/ambiguous mutation remains `0/0/0`.

Alpha.70 remains the previous finalized result. Alpha.71 finalization changes no product behavior beyond the already owner-accepted pre-Drawing architecture and handset orientation policy; it synchronizes version, contracts, Git, and artifacts only.

The existing EAS project and internal `development` profile produced installable iOS Development Build
`8d201f5b…978c` with `expo-screen-orientation` `55.0.20`. The Owner installed that build and accepted the bounded physical orientation and Media/Sketch sanity checks as PASS.

Document type: **Current Baseline**

Canonical owner: `docs/codex-current-state.md`

Result version: `2.0.0-alpha.79`
Status: `ALPHA79_FINALIZATION_COMPLETE`
Product checkpoint: `ALPHA79_COMPLETE`
Owner physical result: `PASS` on iPhone and iPad mini; Regular/Large iPad and Android are `NOT_RUN`

## Final alpha.75 Sketch editing-tools result

Alpha.75 finalizes the icon-only overlay authoring palette, shared WORLD hit testing, Selection/Delete, deterministic
partial erasure of supported visible strokes, exact transient eraser feedback, and one-release/one-history-entry
Undo/Redo semantics on Scene schema v1. Owner physical iPhone and iPad-mini QA accepts the complete bounded tool set and
Save/close/reopen on both devices with at most one Save each; iPad-mini orientation regression is `0`. Regular/Large
iPad and Android actual-device QA remain `NOT_RUN`. Production continues to show `스케치(준비 중)`.

## Final alpha.74 Sketch tools and tablet orientation result

Alpha.74 adds rectangle and ellipse to the retained pen/line/arrow/text Product Sketch while keeping all authored
geometry in the fixed WORLD coordinate system and Scene schema v1. Owner physical QA accepts iPhone and iPad-mini
portrait/open continuity, mixed Drawing behavior, and the single iPad Save/reopen. Compact tablets now use the same
portrait-only product policy as phones, while regular/large tablets retain general WAFL portrait+landscape capability
and every Product Sketch remains portrait-only. The stable responsive detail host, fullscreen prerequisite, root Stack
policy, and generated compact iOS app/window mask are the finalized orientation boundary. Regular/Large iPad and Android
actual-device QA remain `NOT_RUN`; Production continues to show `스케치(준비 중)`.

## Final alpha.73 Product Sketch and Static Sheet result

Alpha.73 adds the bounded authenticated DEV/TEST Product Sketch vertical slice over the finalized alpha.72 Drawing
foundation. The user-facing tools are `펜 / 선 / 화살표 / 텍스트`; mixed history, explicit Save/reopen, and dirty discard
retain one Scene/persistence owner. Release/production continues to show `스케치(준비 중)`, so finalization does not
activate a Production editor or add Drawing export, PDF, image, or R2 coupling.

The cumulative A73C/A73D input work replaces draggable/free-settle common Sheets with one static root whose movement is
derived only from entrance/exit and system keyboard avoidance. Body and Reel scroll independently; focus, keyboard,
registered handoff, nested Sheet ownership, numeric direct input, and static restore remain generation-scoped. The Owner
accepted the instructed actual-iPhone Keyboard / Static Sheet surfaces as PASS. This result does not claim unrun tablet,
Android, or external Address Search provider-result hardware evidence.

## Final alpha.72 Drawing Foundation result

The product feature name is `스케치`. Renderer, SVG, Performance, and PoC labels are development-only diagnostics and
must not become customer-facing product names. Production continues to show the disabled `스케치(준비 중)` affordance;
alpha.72 does not enable a production editor, persistence, export, WorkOrder/API/R2/PDF integration, schema, or migration.

The finalized foundation owns one framework-free `1000 × 1400` logical world, versioned editable Scene v1, camera and
viewport transforms, bounded Scene history, strict serialization, and renderer-independent adapter contracts. The
handset native/runtime orientation layers preserve portrait-up without first-rotation twitch while tablets retain
portrait and landscape. The selected SVG DEV lab keeps the active stroke transient, commits once on release, renders
active and committed freehand through the same deterministic midpoint-quadratic path, and performs pointer-move
committed layer/projection/path rebuild `0/0/0`. Owner physical iPhone QA explicitly accepted curve fidelity, Heavy
response as sufficient, the zero committed-rebuild counters, and portrait zero-twitch. Finalization adds no behavior,
dependency, native/config/EAS, migration, or product-data delta.

## Final alpha.71 pre-Drawing result

The typed `WorkOrderMediaBoundary`, split image/attachment controllers, projection/version coordinator, and split asset APIs retain the complete alpha.70 image and attachment behavior through compatibility facades. The Drawing architecture guardrail defines only future ownership constraints. Drawing implementation remains zero, and Drawing library selection remains zero.

The first native-stack-only orientation attempt is preserved below as rejected evidence. The accepted runtime owner uses `expo-screen-orientation` only at the app boundary: iPhone/handset locks `PORTRAIT_UP`, tablet unlocks to global `default`, and foreground resume performs one serialized reconciliation. Device classification is independent of Recipe/Media/Drawing state. Owner physical iPhone QA explicitly passed rotation after Recipe entry, Recipe entry while the phone was held landscape, Photos/Camera persistence, PDF attachment open/delivery persistence, and the unchanged `스케치(준비 중)` affordance.

## Active alpha.71A pre-Drawing candidate

Status: `ALPHA71_PRE_DRAWING_ARCHITECTURE_REFACTOR_IPHONE_QA_REQUIRED`

Physical result: `PHYSICAL_RESULT_NOT_INFERRED`

The candidate changes ownership only. `WorkOrderMediaBoundary` carries the current persisted image and attachment projection/actions into Overview. The compatibility asset controller composes separate image, attachment, and projection/version owners through one mutation gate, and the historical mobile `assetsApi` import remains a facade over separate read, upload transport, image command, and attachment command modules. `스케치(준비 중)` remains disabled and unchanged. No Drawing runtime or persisted Scene exists.

### Alpha.71A-1 orientation continuation

Status: `ALPHA71_PRE_DRAWING_REFACTOR_ORIENTATION_POLICY_IPHONE_QA_REQUIRED`

The root Expo Router native stack consumed one pure `mobileOrientationPolicy` owner. Native iPhone idiom resolved to handset and `portrait_up`; native iPad idiom resolved to tablet and `default`. Android used the physical screen's shorter side, so swapping width and height on rotation could not turn a phone into a tablet; 600dp and above resolved to tablet/default. `apps/mobile/app.json` kept `orientation: default` and `ios.supportsTablet: true`. Owner physical iPhone QA subsequently proved that placing the option only in root `Stack.screenOptions` did not lock the active interface: both orientation checks failed. This is preserved as a failed mechanism baseline, not a physical PASS.

### Alpha.71A-2 physical orientation-lock correction

Status: `ALPHA71_PRE_DRAWING_PHYSICAL_ORIENTATION_LOCK_CORRECTION_IPHONE_REQA_REQUIRED`

Physical baseline: orientation checks `1/2 FAIL`; Media and Sketch sanity checks `PASS`. Physical correction result: `PHYSICAL_RESULT_NOT_INFERRED`.

Installed Expo Router source shows navigator `screenOptions` and explicit `Stack.Screen options` merge into the same descriptor before the same native-stack view, so an explicit route declaration would not change the failed mechanism. The correction therefore uses the official SDK55 `expo-screen-orientation` runtime module at the root app/navigation boundary. One lifecycle owner serializes and coalesces native calls: handset uses `OrientationLock.PORTRAIT_UP`, tablet calls `unlockAsync()` to preserve the global default policy, web/other performs no runtime action, and background-to-active performs one bounded reconciliation. The existing iOS native idiom and Android rotation-invariant 600dp shorter-side classifier remain the only device-class owner. WorkOrder/Recipe/Media/Drawing state is not an input.

Internal iOS Development Build `8d201f5b…978c` finished successfully on the existing
project/profile and is ready for registered-iPhone installation. Build completion is not a physical orientation result.

### Alpha.72B Drawing renderer PoC comparison

Status: `ALPHA72_DRAWING_RENDERER_POC_ENTRY_GATE_IPHONE_REQA_REQUIRED`

The Owner reports the alpha.72A native iPhone orientation result as PASS (`고정된다`). The bounded comparison PoC is
available only to an authenticated Recipe session in a development bundle; `system_admin` and `[SIM]` company identity
are not entry requirements. Release/production retains the disabled `스케치(준비 중)` affordance. Both renderer adapters consume one canonical `DrawingSceneV1`, one renderer-neutral projected
primitive frame, one camera/viewport transform, and one built-in PanResponder screen-to-world input path. Sparse,
medium, and heavy deterministic workloads are 5/8, 80/800, and 240/4800 elements/freehand-points respectively. Scene
identity survives renderer toggles; render/toggle business mutation is zero. JS Scene-update and toggle-to-next-RAF
timings are labeled narrowly; GPU FPS and memory are not inferred. Persistence, WorkOrder/API/R2/PDF/export integration,
production Sketch activation, and renderer selection remain zero. The Skia adapter avoids the package-root barrel so
unused optional Video/Reanimated exports cannot redbox an otherwise static PoC; no Reanimated/worklets/gesture dependency
was added. Existing-project internal Development Builds
`71a3b621…3abf` (iOS, 26,154,478 bytes) and `a2416e06…e871` (Android, 282,775,915 bytes) are complete and installable; physical renderer
quality is not inferred from build completion.

### Alpha.72C SVG selection and authoring pipeline optimization

Status: `ALPHA72_SVG_RENDERER_AUTHORING_PIPELINE_OPTIMIZATION_IPHONE_QA_REQUIRED`

The Owner's physical SVG/Skia comparison selects SVG: the perceived difference was small, SVG felt marginally faster at
Medium, and Skia showed no clear Heavy advantage that justified its native dependency and binary cost. The framework-free
adapter boundary remains, while the temporary Skia package/lock transitive entries, adapter, reconciler startup workaround,
toggle, and comparison-only contract are removed. The existing Development Build may still contain an unused Skia native
module, but the current JavaScript bundle has no Skia dependency or import and therefore needs no rebuild solely for this
removal.

The active freehand pipeline no longer reconstructs a preview Scene or reprojects the committed Heavy frame for every point.
Pointer down creates one renderer-independent transient stroke in the canonical `1000 × 1400` world. Pointer move applies the
existing conservative `1.5` world-unit minimum-distance policy to that stroke only; the committed Scene identity, serialization,
and history remain unchanged. The committed SVG frame is memoized by committed Scene and viewport transform, while only the
active path is reprojected. Pointer release preserves the final point, creates one canonical freehand element, and performs one
Scene/history commit; terminate/cancel discards the transient stroke with zero commit. Sparse/Medium/Heavy remain
5/8, 80/800, and 240/4800 elements/freehand-points. Production Sketch, WorkOrder/API/DB/R2/PDF/Viewer/Share, schema,
migration, and business data remain unchanged. Performance and curve quality still require Owner iPhone QA.

### Alpha.72C-1 freehand fidelity and Heavy render optimization

Status: `ALPHA72_FREEHAND_FIDELITY_HEAVY_RENDER_OPTIMIZATION_IPHONE_QA_REQUIRED`

Owner evidence reported `samples 73 / accepted 73 / decimated 0`, so the continuation does not attribute angular curves to
sampling and does not alter the accepted `1.5` world-unit threshold. Canonical `DrawingSceneV1` freehand points remain the
exact raw world-coordinate sequence. A dependency-free `midpoint-quadratic-v1` display builder now derives both active and
committed SVG paths from that sequence, preserves exact endpoints, adds no interpolated points, and keeps collinear input
collinear. `measureDrawingPointGaps()` reports average and maximum accepted world gaps without changing acceptance.

The committed SVG layer and active-stroke layer are separate memoized React boundaries. Pointer movement updates only the
active projection/path and causes committed projection, committed path, committed layer, Scene, and history rebuild/commit
`0/0/0/0/0`; pointer release remains Scene/history `1/1`. Sparse/Medium/Heavy workloads remain `5/8`, `80/800`, and
`240/4800`. Production Sketch, persistence, API, DB, R2, PDF, dependencies, native/EAS configuration, and product data are
unchanged. Owner iPhone physical curve and Heavy-performance PASS is not inferred.

## Final alpha.70 result

Status: `ALPHA70_FINALIZATION_COMPLETE`. Product checkpoint: `ALPHA70_COMPLETE`.

Alpha.70 finalizes the cumulative PDF and media workflow without changing the accepted alpha.69 Size/POM and WAFL INPUT behavior. The issued/preview document preserves cover emphasis at 58/42, `coverMain` 140mm, typography floors, long-name wrapping, and deterministic 10-image gallery pagination. Recipe-name autosave is product-name-only with a 500ms debounce and coordinates with image mutation versions. Photo/Camera acquisition no longer depends on React Native Blob `arrayBuffer`; HEIC/HEIF uses the approved Expo-compatible real JPEG transform before prepare/upload. Image inclusion is revision-persisted through additive migration `021`; representative images stay cover-only while selected non-representative images feed the supplemental gallery. The Image tab owns images, the Document tab owns PDF-only new attachments, and legacy selected image attachments remain readable.

Authenticated Draft Preview retains private session transport and uses canonical 2048px large WebP derivatives for PDF embedding, with legacy-original fallback and the existing PDF byte ceiling unchanged. Attachment delivery selection stages in the Workbench but executes and reconciles through the canonical asset controller with sequential expected versions. Owner physical iPhone QA explicitly accepted Photos, Camera, Draft PDF Viewer and attachment delivery-selection behavior before finalization. The reusable EAS Development Build remains unchanged; no finalization dependency/native/config/EAS delta exists.

## Final alpha.69 result

Status: `ALPHA69_FINALIZATION_COMPLETE`

Product checkpoint: `ALPHA69_COMPLETE`

The system Size universe includes waist labels 24–36 without persistence or migration. Size selection shows
target × major recommendations first, keeps company/current/direct choices, and discloses the remaining system
universe only on request. Finished Spec selection keeps detail-ordered POM guidance independently. Numeric WAFL
starter templates use target × major names and major base POMs only; current WorkOrder sizes remain authoritative,
and exact V0.1 values project only onto matching current Size rows. Male new authoring excludes Dress while legacy
values remain readable. Replacement loss is computed from positive quantity and non-empty measurement values only;
its real-loss Decision replaces the active Sheet body with the canonical WAFL INPUT question/helper/reel/V state without nesting another Modal or same-axis parent ScrollView. Recommended-spec loading presents its blocker before content fetch, publishes the successful content before refresh, and releases only after terminal projection/reconcile. Visible global processing owners use the shared presentation-first boundary without decorative delay.

## Final alpha.68 result

Owner physical result: `PASS`

Alpha.68 finalizes Draft delete/Reorder history, Copy and Reorder creation, common core-first hydration,
picker/tab/delete recovery, category/detail/template rebase, local-first Recipe authoring, Size/Color and
Finished Spec coordination, canonical Maker `레시피` terminology versus issued `작업지시서`, and shared
Production/Create processing feedback. Direct-input authoring now has content-aware keyboard detents,
submit-before-blur, internal-tap persistence, keypad-only minimal accessory policy, footerless reusable
create forms, replace-sheet Recipe creation, canonical keyboard-plus-sheet close, and close-animation
ownership that cannot be interrupted by keyboard restore. Owner physical iPhone QA accepted the complete
alpha.68 boundary. Dependency/native/EAS/schema delta is zero, new migration is zero, and production,
Owner, and ambiguous data mutation remain zero.

The checkpoint paragraphs below preserve the implementation boundaries that composed alpha.68. Their
pre-finalization `Owner physical result is not inferred` wording is historical and does not override the
explicit final Owner physical PASS above.

### Accepted alpha.68 implementation boundary

Direct-input close now claims exclusive dismissal/session ownership before blur or `Keyboard.dismiss`.
Keyboard-hide processing suppresses restore, detent, reveal, and refocus geometry while confirmation or
close owns the session; ordinary settle animation also cannot replace an active exit animation. One
tokenized idempotent finalizer owns rendered teardown, user-cancel callback cardinality, and after-close
handoff. The accepted footerless/replace-sheet presentation, internal-tap persistence, minimal keypad
accessory, single measured keyboard Y-owner, drag, and submit-before-blur behavior remain unchanged. Owner physical result
is not inferred.

Direct-input backdrop cancellation and parent/nested `visible=false` transitions now share one close
lifecycle: keyboard restore is suppressed, the mounted input is blurred, the keyboard is dismissed,
the sheet closes, and only a user cancel invokes the business cancel callback. The backdrop claims that
lifecycle on first touch with an idempotent press fallback. Direct-input retains its confirm owner but
renders and measures no footer actions; reusable Size/Color/POM create forms likewise remove their
duplicate body `추가` button and use native Done or the existing minimal keypad action. New Recipe alone
opts into replace-sheet processing presentation: its mounted values survive a failure, but the sheet
surface, interaction, accessibility tree, and accessory are hidden while the creation blocker owns the
foreground. Owner physical result is not inferred.

Direct-input body taps now preserve the active keyboard session. Both shared scroll owners use
`always` tap persistence and no dismiss-on-scroll only in `directInput`, while non-direct sheets retain
their prior `handled` behavior. Normal native-return text inputs no longer attach or render the common
keyboard accessory. Only a focused iOS keypad without a native Return/Done key receives one minimal
semantic action—`다음` when a later editable target exists, otherwise `완료`—through the existing focus
registry and canonical confirm guard. A73B-2 supersedes the 202 unconditional detent/scroll-only split with one measured
scroll-first/minimum-rise keyboard transition; submit-before-blur, validation,
drag dismiss/snap-back, backdrop cancel, and keyboard restore owners are unchanged. Owner physical result
is not inferred.

Direct text-entry sheets use one `directInput` keyboard mode with explicit editing, confirming,
cancelling, and closing session states. Keyboard show itself does not select an intermediate detent.
Mounted-ref semantic-block reveal scrolls available body content first and applies only the remaining minimum
sheet rise, synchronized to the native keyboard transition when available. Last/single native submit
uses submit-before-blur, so invalid input keeps keyboard, focus, and geometry; only the accepted canonical
confirm enters confirming and dismisses the keyboard. While the keyboard is visible, a header drag may
only dismiss the whole sheet through the existing cancel owner or snap back to the current keyboard
detent. Gesture-active hide never starts the unexpected-hide refocus loop. Accessory/native/footer
confirmation still shares one commit guard, phone-pad and multiline semantics remain, and Owner physical
result is not inferred.

The current bounded correction moves shared keyboard-ON reveal measurement from numeric native handles
to actual mounted host refs for the focused semantic block, body viewport, and sheet. Zero, non-finite,
non-positive, out-of-window, stale-focus, and stale-sheet measurements are rejected; one ref remeasure
and one numeric-handle fallback are bounded. The accepted `72`-point clearance, visual-window anchor,
intrinsic-scroll-first calculation, keyboard-OFF restoration, deliberate user-drag ownership, reels,
Decisions, numeric keypad, X/V, and all non-text paths are unchanged. Owner physical result is not inferred.

The current correction gives keyboard text-entry WAFL INPUT sheets one shared `72`-point focused-field
clearance. It applies to new Recipe, direct Size, direct Color, direct POM/measurement, Overview direct
text, saved-spec naming, and Quick Delivery direct text owners. Reveal capacity now excludes transient
keyboard padding: short forms lift only by the missing clearance, while genuine intrinsic overflow may
scroll first. Numeric keypad `112`, generic `56`, reel, Decision, and non-text policies are unchanged.
Keyboard hide still restores the exact pre-keyboard resting offset for three repeated cycles unless the
user deliberately dragged. Owner physical result is not inferred.

The current correction makes Maker authoring language consistently say `레시피` across create,
list/detail, copy/reorder, deletion, permissions, loading, image/material/spec editing, and the
confirmation boundary. Issued/final PDF, print, Viewer, sharing, and historical issued-document
surfaces retain `작업지시서`. The shared sheet now measures adaptive body height from the intrinsic
content plus the static semantic end gap only; transient keyboard inset remains scroll/reveal space
and cannot contaminate medium detent geometry. Delayed content-size callbacks therefore cannot keep
the create sheet above its pre-keyboard resting position after native hide. Owner physical result is
not inferred.

The current correction makes native keyboard hide restore the exact pre-keyboard WAFL Sheet resting
offset whenever the user did not drag the sheet during that keyboard session; the restore no longer
depends on whether field reveal happened to raise the sheet. The create field clears its one-shot focus
policy on both submit and blur/native hide, preventing automatic reacquisition across repeated cycles.
Production dirty Basic/Additional transitions now send both the shared save-blocker title and helper,
while clean transitions remain silent. Direct Recipe creation renders the existing shared processing
blocker inside the native input Modal, so it is visible above the sheet without duplicating the global
Copy/Reorder blocker. Owner physical result is not inferred.

The current correction clears the local detail item immediately when a category reset is confirmed.
At the next true boundary, the reset remains the canonical first command; when the user has already
chosen a new category-owned detail, one serialized item-only command uses the first result version.
Failure of the second command keeps the local item retry intent. Saving or updating a company Finished
Spec template now rebases the current WorkOrder source ID/version in the same transaction and the read
model treats that command event as the new unmodified baseline. Direct create uses a one-shot entrance-
focus gate so Done cannot be followed by a sheet-owned refocus. A dirty Production Basic/Additional
switch reuses the central save blocker, while clean switches do not. The owner physical result is not
inferred.

The latest correction removes the last immediate Overview category-reset flush. A confirmed
category change and its dependent-reset intent remain local through other Overview fields and are
sent once only at a true boundary. Size/Color multi-select now computes one atomic local structure,
so XS/S/M and multiple colors share the same matrix/spec projection before persistence. The applied
WAFL/company template content is read through the existing compatible-template route and cached for
missing-only local late-size projection; server backfill remains authoritative at flush. Automatic
size synchronization does not mark template content modified. The create product-name field alone
uses native `blurAndSubmit`, and only direct create says `새 레시피를 생성 중입니다.`. Owner
physical result is not inferred.

The latest bounded correction preserves Draft local-first authoring while removing false boundaries inside a tab. Overview field-to-field movement and picker V remain local, including immediate local due-date projection; only top-level navigation and business-command boundaries flush. Production Basic/Additional switching is a section boundary and proceeds only after its dirty flush succeeds. Size/Color structure and quantity now share one local logical owner: temporary Size/Color identities form the matrix immediately, then a boundary creates authoritative structure IDs, remaps dirty quantities, and persists the destination matrix. Applied WAFL and company templates retain their source identity even with zero current sizes; later supported sizes backfill only empty measurement cells without overwriting user edits or marking the snapshot modified. Successful local or fast boundary saves are silent. Maker list/create/copy/confirmation authoring language uses `레시피`, while issued PDF, print, Viewer, and sharing keep `작업지시서`. Owner physical result is not inferred.

The preceding bounded correction makes the current WorkOrder category authoritative for WAFL basic-spec recommendations and item-code add-ons, so T/B/O/D recommendations no longer depend on an empty or stale persisted spec category. Reorder Draft deletion preserves its durable non-navigable lineage tombstone while casting the deleted WorkOrder identity to the existing text event owner. Maker decisions use one WAFL INPUT two-row reel with a safe default and one V; ordinary WAFL editors retain X/V. Transient success, warning, and error notices use one buttonless centered WAFL Alert with a 1.2-second default, while command loading remains explicit and completion-owned.

Draft inputs update local presentation immediately and enter one section-owned dirty generation.
Tab change, detail exit, app background and explicit confirmation all flush through
the same serialized coordinator; a stale response cannot mark a newer generation saved. Size/Color
quantity cells submit one validated matrix batch rather than one PATCH per cell. Copy creates an
independent original Draft with independent image/attachment identities and no lineage, issue,
document, token or event history. Reorder retains the alpha.67 server-owned Nth lineage but permits
only due date, quantities, prices and the Basic Process memo while rejecting specification/config
mutation at the server boundary.

`작업지시서 확정` flushes all dirty sections before canonical readiness and issue. Drafts may use
the final renderer through an authenticated ephemeral byte response without document revision,
public token or long-lived object creation. Download/print/share remain confirmed-only, and standard
sharing has one 72-hour policy. Confirmed due-date and Basic Process memo edits are the only mutable
post-confirm fields; they retain the existing document identity and update its private PDF bytes so
active branded links remain current. User attachments stay image/PDF only and open through native
authenticated viewers. The three-file Expo `--clear` / stale-Metro detection change was verified as
`PREEXISTING_A68_RUNTIME_HARDENING_DELTA` and is absorbed into this candidate.

Draft list Delete now uses one exact semantic runtime capability and exact Maker route, deletes only
the confirmed Draft graph and its exact-owned R2 objects, and reconciles the list immediately; cancel
performs no mutation and issued rows remain locked. Reorder-owned material request/cancel/complete
actions preserve structural locks but remain physically executable. Every list row shows authoritative
`work_orders.created_at` as KST `YY/MM/DD HH:mm:ss` without a prefix label and without changing updated-time sorting.
List-started Reorder stays on the list shell under the shared creation blocker until the exactly-once
server command returns and the authoritative created core detail opens; optional children hydrate later.
Material and Production request/cancel, final WorkOrder generation, and Draft deletion share one
confirmation-when-needed, processing-blocker, and success-banner grammar. Material direct numeric input
normalizes fresh and re-saved values to at most three meaningful decimals without changing numeric truth.

The source-audit remediation gives list swipe a deterministic intent/settle owner: touch-down and
dominant vertical motion keep both action panels visually absent, while deliberate horizontal motion
tracks within resisted canonical leading/trailing widths and one list-owned open-row identity. Copy
runs exactly once, opens the authoritative created ID after core-detail hydration, and treats images,
partners and series history as independently retryable child projections. Size/Color owns a latest-
value-wins dirty-cell map and sends only current destination cells; successful acknowledgement clears
only unchanged generations. Runtime evidence also corrected the external QA ingress allowlist for the
Copy and atomic quantity-batch routes, which had been the actual pre-handler 404 owner. Image complete
uses bounded derivative retry and compensates terminal object-integrity failure without duplicate rows
or orphan objects. Reorder presentation keeps its server allowlist and read-only affordances, failed
batch navigation retains retry/discard, and the native image viewer keeps its light neutral surface.

The focused post-audit correction preserves the accepted swipe intent and one-open-row policy while
making the trailing Delete action fill the complete canonical snap geometry. Size/Color quantity
inputs explicitly remain editable and focused during background batch persistence, without changing
the default saving lock used by other inline fields. The exact authenticated Draft Preview route is
now admitted by both external-QA ingress owners. Reorder keeps material/process identity and structure
locked while its own Fabric/Accessory and Basic Process request/cancel/complete lifecycles operate
independently from the source. Copy blocks interaction only through exactly-once creation and core
detail hydration, stores one normalized `(복사본)` prefix in both WorkOrder and revision truth, and
then hydrates optional children asynchronously. Attachment PDFs reuse the sticky native bottom Close
grammar. Owner physical result for these focused changes is not inferred.

The current focused checkpoint gives final generation and Draft deletion one shared WAFL safety-card
family with staged X/Check controls and a spinner-free decision state. Saving blocks interaction only
for the real flush duration, remembers the first valid tab/field/navigation intent, and replays that
intent once after success. Deleted Reorder Draft payload/assets remain hard-deleted while a minimal
durable domain-event tombstone preserves the used round in Work History and next-round allocation.
Partner selectors consume canonical multi-type capability identities, the Finished Spec selector
receives the exact T/B/O/D category, and category changes atomically clear detail item, Size/Color,
allocation, canonical total, starter-template binding, and Finished Spec while preserving Materials
and Production. Legacy explanatory order yes/no popups are absent; lifecycle guards and processing
feedback remain. No migration was required. Owner physical result is not inferred.

WorkOrder entry now has one core-first hydration owner across list selection, Work History navigation,
Copy, and Reorder. The authoritative detail read makes the WorkOrder usable immediately; images/assets,
material-partner options, and series history settle independently with one bounded retry and entity-version
reconcile. A child failure remains visible and retryable without converting a valid core WorkOrder into an
open failure. Runtime traced the physical warning to the series-history query using nonexistent
`domain_events.created_at`; the durable event time is `occurred_at`. The read route now returns a bounded
correlated error instead of an uncorrelated framework 500. Owner physical result is not inferred.

Basic-information picker apply now owns one explicit dirty generation and one serialized flush. Major-
category confirmation exists before any destructive generation is staged, so cancel performs no HTTP/DB
mutation and confirm produces one atomic category/reset command. The overview save owner builds its patch
against the latest authoritative detail ref instead of an effect-captured historical projection. A successful
canonical reload clears the active field/session and the overview batch generation, removing the prior
save-error tab dead-end without silently discarding dirty input. Draft deletion keeps the exact server hard-
delete/R2 owner and records the authoritative deleted ID in the mobile list boundary so an older list or
detail response cannot resurrect or reopen it. Runtime API evidence returned PATCH/DELETE 200, stale-version
PATCH 409 CONFLICT, post-delete core 404, and zero list/fixture residual. Owner physical result is not inferred.

This file is a compact present-state snapshot. It is not a version history, Permanent Rules owner, runtime process ledger, or evidence archive. Historical implementation details belong to numbered immutable evidence under `docs/project/app-v2/`.

## Final alpha.67 result

Alpha.67 activates one bounded Reorder creation command on top of the finalized alpha.66
identity foundation. Only an issued, finalized, non-Sample original or direct Reorder may be
the direct source. The server locks the stable original series root, allocates the next global
round transactionally, and owns source/root/revision identity; the client confirmation supplies
the canonical zero/unset quantity and null due date for the new draft. Receipt idempotency plus the migration `019`
series-round unique index make retry and concurrency deterministic without migration `021`.

The new draft copies product identity, Size/Color options, Finished Spec, editable material and
process configuration, the current representative image, and only final-revision attachments
explicitly marked `output_include`. Asset copies receive independent IDs and R2 keys; filename
heuristics are forbidden. Size/Color production cells start at zero, and material/process order
or execution state, document history, Events, Receipts, generated documents, and public tokens
do not carry over. WorkOrder total quantity starts at zero and due date starts unset. Overview
exposes `리오더 만들기` and an original-plus-direct-Reorders `작업 이력`; success navigates
straight to the new Reorder Overview. Detail entry now treats Series History as contextual:
core detail, images, and partner data remain the required hydration set, while Sample skips the
inapplicable history read and a history-only failure cannot collapse an otherwise valid detail.
After a successful Reorder command, the returned WorkOrder ID is committed before any list or
detail refresh. A filtered-list miss is valid, and recovery retries only that committed row's
read/hydration; it never resends the create command. The image-complete pipeline uses the
canonical R2 Worker with both `R2_BUCKET` and `IMAGES` bindings and supplies a `ReadableStream`
to the Images transform input before derivative persistence. Actual Rework creation and Additional Process Order remain
outside this result. APP_VERSION is `2.0.0-alpha.67`; production and owner-fixture mutation
remain zero.

The current physical-blocker remediation also makes one server resolver own both readiness and
issued document-number item segments. A non-ASCII detail item falls back to the already persisted
canonical major-category code rather than asking the user for an English item code. Generated-
document authorization now consumes the canonical `DOCUMENT_R0` capability guard for ordinary
and Reorder WorkOrders without an alpha.64 profile name. Issue success remains committed when PDF
generation fails; the workbench reports partial success and retries only PDF generation. Draft
material removal is explicit: never-requested rows hard-delete, cancelled history-bearing editing
rows use the existing archive lifecycle, and requested/completed rows stay protected. Production
complete/cancel actions share the same compact icon-only action geometry. This does not imply full
alpha.67 or owner physical-iPhone acceptance.

The current PDF parity continuation preserves issue and Reorder truth while correcting two
mobile-only boundaries. Generated PDF calls no longer inherit the generic 15-second transport
deadline: the document client uses the bounded 120-second render budget and reconciles a returned,
pending, timed-out, or already-generated identity through the canonical document list. A retry with
a new request key reuses a current generated or recent pending row and never re-issues, creates a
revision, or duplicates R1/R2. Mobile `보기` no longer opens the workspace-session internal file
route. It resolves the existing embedded-QR token identity through an authenticated viewer-target
read and opens `/v`; that page establishes its own public viewer session before serving the PDF.
The internal file route remains workspace-session protected, and no raw R2 URL is exposed. Owner's
Reorder copy/zero-quantity/history/source-immutability observations remain partial physical PASS;
the full physical result remains uninferred.

The current mobile image asset integrity continuation makes the bytes fetched from the iOS asset
URI the upload-size source of truth. Image completion reads the uploaded R2 object before creating
derivatives, validates its actual MIME and bounded byte length, computes SHA-256, rechecks quota
against actual bytes, and persists those actual values. PDF generation keeps strict size/hash
verification for canonical hashed assets; a legacy image with no stored hash may use the existing
safe R2 object after MIME/size bounds are verified and its actual hash is computed in memory,
without DB backfill. Read-only owner-failure tracing disproved a metadata-size mismatch for the
recent attempts and instead isolated the first failure to a cover DOM taller than one A4 landscape
page, which emitted extra landscape pages before portrait content and failed page-orientation
validation. Print geometry now bounds the cover to one page. This checkpoint still requires owner
physical-iPhone re-QA; `PHYSICAL_RESULT_NOT_INFERRED` remains authoritative.

The current Document UX continuation preserves the owner-confirmed native PDF view and extends its
single renderer with explicit previous/next page controls synchronized to scroll-driven page state.
Basic Process requested state now exposes only status and cancel; WorkOrder issue remains its sole
normal Maker completion trigger. Document Save reuses the workspace-authenticated byte transport,
verifies PDF signature/size and copied SHA-256, opens the native local-file save/share surface, and
cleans its temporary file without Safari or public-token creation. Share/QR metadata uses four rows,
native share copy contains one controlled viewer URL, and `/v` mounts the session-authorized PDF
inline before its secondary Download action. `BRANDED_PUBLIC_VIEWER_DOMAIN_DEFERRED` remains until a
verified production viewer-origin owner exists. APP_VERSION remains `2.0.0-alpha.66`; owner physical
result is not inferred.

The current pagination/viewer-touch continuation preserves that document architecture. The native
renderer can no longer cover the safe-area header touch plane: chevron and label share one 44-point
Pressable whose activation closes the viewer back to the current WorkOrder Document context.
Finished Spec pagination keeps a section together whenever it fits a page, moves it intact when only
the current remainder is insufficient, and emits repeated headers plus `(계속)` only for a truly
oversized section. Full-view Finished Spec expands all POM rows under the sheet body scroll owner,
reports the actual item count and remaining-scroll affordance, and lets a single selected Size use
the available table width. Issued PDF quantity display preserves decimal-string precision while
removing trailing fractional zeroes. Public `/v` and Download remain regression-only physical PASS.

## Current alpha.66 result

The current candidate introduces the WorkOrder identity/lineage foundation without reviving the v1 sample/main/rework state model. Sample character, derivation lineage (`original`/`reorder`/`rework`), workflow status, and document revision remain independent axes. Additive DEV/TEST-only migration `019` owns the identity columns and tenant-safe lineage references, while additive DEV/TEST-only migration `020` enforces that Sample never carries direct Reorder or inherited reorder-round context. Sample Rework remains valid at round zero; Reorder and Rework inherited from Reorder are forced 본생산. Production migration and production/owner-fixture business mutation remain zero. Normal create defaults Sample ON in each fresh mobile session while an omitted API value defaults false, and the WorkOrder-level Sample flag remains editable only where it cannot violate the lineage invariant.

The WorkOrder list stays flat. Existing workflow status chips remain the only permanent rail. Create and detail share the canonical `본생산 / 샘플` WorkOrder-character semantics while using context-appropriate variants: create retains the labeled form-sized `작업 구분` control and fresh `샘플` default; eligible round-zero detail uses a compact grouped control anchored at the hero top-right, while forced-본생산 reorder context hides the invalid switch. Detail places the strong workflow status directly below the representative image, omits the redundant informational Sample pill, and retains only applicable Reorder/Rework lineage pills in the text-side identity row. The passive `원본 · ... / N차 계보` subtitle remains hidden without deleting lineage data. The two-axis filter truthfully yields zero for Sample+Reorder and preserves Sample Rework. Overview no longer renders partial `다음 확인` copy: the complete canonical readiness issue array owns the compact `발행 전 확인 N건` row and every row in its read-only WAFL Sheet, with stable issue-code navigation and an explicit `발행 준비 완료` zero state. Successful readiness-relevant mutations now reconcile the same canonical detail projection whenever `readiness.basedOnVersion` trails the WorkOrder entity version; Production also publishes its successful local command through that shared refresh boundary. No mobile counter exists. Actual Reorder and Rework creation/copy E2E and source navigation remain deferred to alpha.67/alpha.68. Physical iPhone results are not inferred from automated verification.

## Repository and version

| Field | Current value |
| --- | --- |
| Repository | `C:\CWJ_Project\peacebypiece-2.0` |
| Branch | `master` |
| Alpha.66 entry HEAD/origin | `55f812b0f8300032ae55c9f222d9f671f947c044` |
| Entry commit | `feat: WAFL v2 alpha.65 Maker 입력 UX와 완성치수 도식 완성` |
| Entry ahead/behind | `0/0` |
| Entry working tree | clean |
| APP_VERSION | `2.0.0-alpha.71` |
| Mobile package version | `2.0.0-alpha.71` |
| Root package version | `0.5.637` |
| Expo public version | `2.0.0` |
| iOS Development Build | build number `1`, reusable while native inputs remain unchanged |
| iOS bundle identifier | `com.wafl.app` |
| Android package | `com.wafl.app` |

The source cannot contain the hash of the commit that contains itself. Final alpha.66 HEAD, origin synchronization, Git cleanliness, ZIP hash/size/entry count, and exact repo-state filename are owned by the matching post-push alpha.66 repo-state.

## Latest delivery boundary

- Target Source ZIP: `peacebypiece-ui-2.0.0-alpha.71.zip`.
- Target repo-state: `repo-state-2.0.0-alpha.71-<actual timestamp>.txt` when the canonical Finish tool emits one.
- The accepted release handoff is generated from the final synchronized pushed alpha.71 HEAD.

## Current product and transport baseline

- Customer product direction: Expo React Native mobile/tablet first.
- Metro transport for approved external development QA: private Tailscale LAN HTTP under the Development-only ATS boundary.
- Developer authentication and WorkOrder API transport: tailnet-only Tailscale Serve HTTPS.
- Preview/Viewer transport for the current App-first development line: the same tailnet-only Tailscale Serve HTTPS origin used by DeveloperAutoConnect.
- Next backend for DeveloperAutoConnect: localhost-only.
- Tailscale Funnel: disabled; only structural `AllowFunnel: true` means enabled.
- Default external runner mode: read-only `DeveloperAutoConnect`; separately approved mutation Deltas may enable only their exact process-local route set.
- The manual one-time connection-code fallback remains available.
- Normal flow dependency on localhost:3000: none.
- Production access and mutation: blocked by default.

Alpha.65 is the current finalized result at `ALPHA65_MAKER_INPUT_FINISHED_SPEC_VISUAL_COMPLETE`. It preserves the complete alpha.64 Maker/document foundation while finalizing cumulative Production authoring, common WAFL INPUT/PICK and reusable direct-create behavior, Finished Spec Size source-of-truth with cm/exact 1/8-inch input, Address Search interaction, and the visual Finished Spec selector. The selector keeps eight authored T/B/O/D front/back technical-flat assets, one focused preview at most, and all 55 stable side routes. The owner accepted the current garment art for release under `OWNER_RELEASE_ACCEPTED_WITH_PROVISIONAL_GARMENT_ASSETS`; designer-authored replacement of the same eight SVG views remains `DESIGNER_AUTHORED_GARMENT_SVG_REPLACEMENT_DEFERRED` and must preserve the renderer, focused-preview, routing, grid and X/V contracts.

The following alpha.65 checkpoint paragraphs are cumulative implementation history. Their interim re-QA labels and alpha.64 version boundary do not override the finalized result above.

The active dirty alpha.65 candidate is a post-alpha.64 Production authoring Delta and does not replace the finalized version baseline. It removes the historical read-only six-step flow presentation from the live `제작` tab and adds one draft-only Production factory plus zero-to-many additional processes through the canonical sheet/value-field/reel owners. Factory/process eligibility comes from the existing tenant partner and company-enabled system process standards. The client does not own process quantity or amount: current WorkOrder total is projected server-side into every mutable current-revision process row, and process/revision totals update in the same command transaction. The schema and migration ledger remain unchanged. This candidate stops at `ALPHA65_PRODUCTION_FACTORY_AND_PROCESS_AUTHORING_IPHONE_QA_REQUIRED`; APP_VERSION stays `2.0.0-alpha.64`, and commit/push/release remain prohibited until owner physical-iPhone approval and a separate finalization.

The current alpha.65 continuation moves active factory instructions to the Production row owner without rewriting historical data. Image/Attachment no longer renders or edits the revision-scoped `공장전달메모`; its existing persisted value remains intact and continues to serve unchanged document/PDF consumers. Factory and additional-process sheets now share one `메모 (선택)` multiline field backed by each row's existing `work_order_processes.memo`; unrelated partner, cost, and total-quantity synchronization preserves that memo, nullable clear uses the existing null semantics, and row deletion removes it with the row. No schema or migration is added. This continuation stops at `ALPHA65_PRODUCTION_MEMO_OWNERSHIP_IPHONE_REQA_REQUIRED`; APP_VERSION, Git delivery, production data, and the owner fixture remain unchanged.

The current alpha.65 Production presentation candidate preserves those process/domain contracts while replacing the normal multi-field factory/process form sheets with shared card + inline authoring. Factory, process, and eligible partner remain WAFL PICK decisions; unit price and process-row memo use the live `ControlledInlineEditValue` owner and serialized version queue. `WaflWorkOrderTabBody` now owns the common horizontal body inset as well as the accepted top inset, and Production authoring no longer shows derived expected cost. Server `amount`, `process_total`, `estimated_total`, memo ownership, quantity synchronization, locks, and document consumers remain unchanged. The checkpoint is `ALPHA65_PRODUCTION_CARD_INLINE_UI_IPHONE_REQA_REQUIRED`; owner physical-iPhone review, version delivery, migration `019`, production mutation, and owner-fixture mutation remain pending/zero.

The latest alpha.65 Production refinement keeps one outer Production section with the shared `기본 공정 / 추가 공정` category switch and a contextual action. Production and Materials now share the compact entity-card root and compact lifecycle action family while retaining separate domain owners. Basic Production uses the existing process status as `발주 전 → 발주 요청 → 발주 완료`, with request cancellation returning to editable `ready`; Additional Process stays authoring-only. Unit labor cost is integer-won input, process memo is a counted 100-character multiline value, new eligible-partner PICK stages its first real result, and an empty eligible list remains a usable X-only reel with disabled V. The retained isolated fixture verified request/cancel locking, memo preservation, aggregate synchronization, and current process-option projection; completion remains an owner physical-iPhone action because it is terminal. This candidate stops at `ALPHA65_PRODUCTION_MATERIAL_STYLE_LIFECYCLE_IPHONE_REQA_REQUIRED`; APP_VERSION remains `2.0.0-alpha.64`, migration ledger remains `18/18`, and version delivery, production mutation, and owner-fixture mutation remain zero.

The current alpha.65 physical-parity remediation moves compact selection/value typography, lifecycle action rows, and the one-line summary into shared Material/Production presentation owners. Production summaries now expose only authoritative WorkOrder quantity and process amount. Inline process mutations pre-read and publish the current process projection inside the serialized queue so a lifecycle delete/recreate cannot leave a stale process identity; the unique factory role may reconcile to its sole current row, while additional processes require an exact current ID. The prior physical generic 404 was traced to an alpha.64 external capability profile serving an alpha.65 UI, not to the process repository; canonical Runtime is now `alpha65-current-maker`. Factory/process/partner PICK routes share one active reel-sheet invocation, required partner PICK stages its first real option before entrance, the new-process `미지정` sentinel remains non-persistable, and memo staging is hard-clamped to 100 characters. Isolated Runtime QA completed 35/35 HTTP 200 requests with zero 404 across price, memo, rapid sequential edits, request/cancel, and delete/recreate/new-ID saves. This candidate stops at `ALPHA65_PRODUCTION_PHYSICAL_PARITY_SAVE_PICKER_IPHONE_REQA_REQUIRED`; physical drag parity still requires owner iPhone re-QA. APP_VERSION stays `2.0.0-alpha.64`, ledger stays `18/18`, and migration `019`, production mutation, owner-fixture mutation, version bump, commit, push, and release remain zero.

The common-picker physical-drag continuation fixes the shared mounted responder boundary rather than any Production-local sheet. `WaflInputSheet` now establishes its stable visual offset, touch page-Y base, and ready flag synchronously on responder grant; it no longer waits for an asynchronous native animation-stop callback that could discard the first MOVE. Target, Major Category, Unit, Factory, Process, and Partner therefore retain one `WaflReelPickerSheet`/`reelAdaptive`/free-settle path. Required-choice opening also normalizes an empty or invalid current candidate to the first real option before the reducer opens, while nullable pickers, the new-Process `미지정` sentinel, and zero-result safe state remain unchanged. Automation preserves the mounted contract but does not infer physical iPhone success. The checkpoint is `ALPHA65_COMMON_PICKER_PHYSICAL_DRAG_IPHONE_REQA_REQUIRED`; all delivery, migration, production-data, and owner-fixture boundaries remain unchanged.

The current alpha.65 common-UI continuation fixes the remaining caller-side Partner staging gap: every required eligible-partner route opts into first-real staging even when an existing process row currently has no valid partner, so the reducer value, reel index, and V state agree on first open. `ControlledInlineEditValue` now uses the same shared single-line geometry before and during focus; only colour/tint/caret emphasis changes, while multiline growth remains content-driven. WorkOrder tabs retain usable cached/parent data during refresh, and uncached asynchronous Size/Color, Materials, or Production sources use one shared delayed tab loader with safe retry on real failure. The Overview issue-summary suffix, Image empty-state policy sentence, and due-date sheet eyebrow are normalized without changing readiness, attachment, or calendar behavior. The checkpoint is `ALPHA65_COMMON_UI_CONSISTENCY_IPHONE_REQA_REQUIRED`; APP_VERSION, ledger, migration, production/owner data, Git delivery, and release boundaries remain unchanged.

The current alpha.65 sheet-inventory continuation declares 25 live mobile sheet surfaces: 22 canonical draggable/free-settle routes, one intentionally fixed short confirmation, and two interaction-specific fixed exceptions. Address Search remains on `WaflInputSheet` and requests focus only after its atomic presentation, so the common 44-point header responder and the result-body scroll do not compete during entrance. Size, Color, and Spec direct creation now reuse one `WaflReusableCreateForm` field/action shell while Color retains its palette. Overview reel/date, Material reel, and Production selection source fields keep identical participating geometry while their child sheet is open; active state changes paint only. The checkpoint is `ALPHA65_SHEET_INVENTORY_REUSABLE_CREATE_ACTIVE_GEOMETRY_IPHONE_REQA_REQUIRED`; automation explicitly does not infer physical gesture or visual acceptance, and all version, migration, production/owner-data, Git, and release boundaries remain unchanged.

The latest alpha.65 visual-spec correction preserves the 55/55 stable catalog mapping and grid-only multi-selection while moving garment recognition out of annotation code. Four supplied fixed technical-flat SVG assets now render through one selection-free static garment owner, and the existing category-authored measurement paths render above them as a separate dynamic overlay. The renderer contains no procedural silhouette fallback, selected state changes overlay styling only, and unsupported/legacy categories remain truthful grid-only surfaces. The checkpoint is `ALPHA65_STATIC_GARMENT_ASSET_OVERLAY_IPHONE_REQA_REQUIRED`; owner physical-iPhone visual acceptance remains required, while APP_VERSION, ledger, schema, data, Git delivery, and release boundaries remain unchanged.

Owner physical review found that painting every inactive measurement span, connector, endpoint, and extension above the fixed garment still read as a pale second drawing. The completed declutter phase removed inactive full geometry while retaining four garment owners and all 55 authored mappings. It is now historical input to the focused-measurement state below: current no-preview has no neutral label index, and grid selection remains the sole staging owner.

The current focused-measurement continuation preserves arbitrary grid multi-selection while giving the diagram one non-persisted preview key. A fresh chooser is garment-only; one mapped toggle shows one warm measurement explanation, another mapped toggle switches that single preview without clearing checks, and an unmapped/custom/current toggle or preview toggle-off returns to garment-only. V still applies all staged items and X applies none. Four fixed assets retain authored SVG/TS path parity and now use uniform scale/translation; the upper is shortened to a neutral top, the lower is reauthored as a conventional front trouser flat, and quiet construction details use the deep-navy family. The target is `ALPHA65_FOCUSED_MEASUREMENT_PREVIEW_TECHNICAL_FLAT_IPHONE_REQA_REQUIRED`; `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` remains mandatory and all version, ledger, data, Git, and release boundaries remain unchanged.

The current front/back continuation replaces those four single-view flats with eight authored views: front-left and back-right for upper, lower, outer, and dress. Each pair is rendered together in garment-only state with no measurement geometry or label. All 55 stable mapped system specs own an explicit `front` or `back` side, and the existing singular ephemeral preview paints one explanation only on that side; staged multi-selection and V remain independent. The target is `ALPHA65_FRONT_BACK_TECHNICAL_FLAT_PREVIEW_IPHONE_REQA_REQUIRED`. Automated evidence is a rejection gate only, so `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` remains mandatory and version, ledger, data, Git, and release boundaries remain unchanged.

The current bounded fidelity continuation preserves that front/back architecture and corrects only the upper, outer and dress shoulder/armhole joins rejected on physical iPhone. Each affected view now has one continuous outer garment silhouette plus quiet armhole construction seams, eliminating the detached closed sleeve loops that made the shoulder and sleeve connection read as doubled geometry. Lower stays byte-identical to the accepted reference, the 55 side routes and singular focused preview are unchanged, and the checkpoint is `ALPHA65_FRONT_BACK_SHOULDER_ARMHOLE_FIDELITY_IPHONE_REQA_REQUIRED`. `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` remains mandatory.

The current narrow visual continuation keeps that accepted two-view and shoulder/armhole structure while correcting the remaining owner-reported neckline and pocket fidelity only. Upper and dress front/back now use simple symmetric round necklines; outer front/back use a restrained rounded neck/collar construction and the front owns two straight axis-aligned pockets. Lower remains byte-identical, all 55 side routes and the singular focused preview remain unchanged, and the checkpoint is `ALPHA65_NECKLINE_OUTER_POCKET_FIDELITY_IPHONE_REQA_REQUIRED`. Automated evidence remains a rejection gate and `PHYSICAL_VISUAL_RESULT_NOT_INFERRED` is mandatory.

External-QA Runtime port policy is WAFL-owned rather than PC-global. Port 3000 blocks strict READY only when a listener is WAFL-owned or its process provenance cannot be resolved. A listener proven unrelated by exact PID/parent, executable path, and CommandLine path is preserved and reported separately without weakening Next 3100, Metro 8081, Serve 443→3100, host-equality, manifest/bundle, read, or forbidden-tunnel gates.

The direct-create CTA parity continuation gives the Size, Color, and Spec parent choosers one `WaflReusableCreateEntryAction` owner for the visible plus icon, `직접 만들기` label, 44-point hit target, spacing, and pressed/disabled states. Their child forms keep the single `WaflReusableCreateForm` owner for the full-width `추가` action. Size and Color direct-create routes no longer inherit the selection-list wrapper's extra top and horizontal inset, so their child action slot now matches Spec while Color palette behavior and parent staged X/V semantics remain unchanged. The checkpoint is `ALPHA65_DIRECT_CREATE_CTA_ACTION_PARITY_IPHONE_REQA_REQUIRED`; physical iPhone acceptance and all version, migration, production/owner-data, Git, and release boundaries remain unchanged.

The current alpha.65 visual-spec continuation replaces the long Finished Spec chooser rows with one data-driven visual selector and one four-column staged grid. Canonical system keys map every current WAFL-provided item for upper, lower, outer, and dress categories to labeled technical measurement geometry; the diagram is feedback-only and grid buttons remain the only selection targets. Company/custom and retained current items preserve X/V staging, rename/deactivation, and direct creation, while Other and legacy Setup remain grid-only. New Overview authoring omits Setup without deleting, migrating, remapping, or hiding persisted setup WorkOrders or their Finished Spec values. The checkpoint is `ALPHA65_VISUAL_SPEC_SELECTOR_IPHONE_REQA_REQUIRED`; APP_VERSION stays `2.0.0-alpha.64`, migration ledger stays `18/18`, and version delivery, production mutation, owner-fixture mutation, and migration `019` remain zero.

Owner physical iPhone review rejected the first diagram's generic midpoint-to-rail connectors because intersecting diagonals made the garment read as a wireframe. The current fidelity continuation preserves the generic renderer, stable 55-item mapping, grid staging, and setup compatibility while replacing annotation layout with four hand-authored technical-flat definitions. Every mapped item now owns explicit measurement, extension, connector, and label geometry; inactive lines are quiet, selected styling is geometry-neutral, and the compact footprint keeps the four-column grid usable. Phone-viewport base/selected evidence for all four categories is inspected before handoff, but physical visual acceptance is not inferred. The checkpoint is `ALPHA65_VISUAL_SPEC_DIAGRAM_FIDELITY_IPHONE_REQA_REQUIRED`; all version, migration, production/owner-data, Git-delivery, and release boundaries remain unchanged.

The implementation-checkpoint paragraphs below record the bounded source states that were accepted into alpha.64. Their interim `OWNER_PHYSICAL_REVIEW_REQUIRED`, re-QA checkpoint, and alpha.63 pre-finalization statements are historical boundary facts; they do not override the final result and owner approval above.

The current alpha.64 remediation preserves that real R0 data/API foundation while restoring
the established ProductionCard document-workbench information hierarchy in the mobile
`문서` tab. The pre-generation view now leads with the actual product image/name, due date,
quantity, active fabric/accessory counts, truthful factory placeholder, factory-delivery
memo, and optional attachment selection; internal document metadata and fixed-content badge
clouds do not dominate the normal screen. Compact generated-document actions and secondary
share/managed-QR controls retain the accepted R0 lifecycle.
`ProductionCardMock` and `/ui` remain visual/IA evidence only and are not imported into the
normal Runtime. The latest bounded remediation makes blocked R0 creation tappable so canonical
readiness blockers are shown without mutation, adds a collapsed read-only size/color quantity
projection, and uses the existing attachment output flag for both supported PDF-body images and
an all-file controlled Viewer delivery bundle. The current v2 model still has no production-
category owner, so the visible position is `미지정` and non-interactive.

Quick Delivery now has a real-data UI foundation only: current requested fabric/accessory rows
are grouped by actual supplier, factory-capability partners are offered for destination, and
origin/destination/driver/memo edits remain local until a read-only preview. Persistence, PDF
issuance, migration `017`, events, receipts, R2 objects, and tokens are explicitly deferred.
R1, Factory, and production behavior remain excluded.

The latest bounded alpha.64 remediation makes nullable partner/factory selection explicit in the
canonical WAFL reel (`미지정` first, registered items next). Direct entry is a mode outside the
option list: picker mode exposes `직접 입력으로 변경`, while direct mode exposes
`WAFL PICK으로 변경` through the same input-mode owner as numeric WAFL INPUT. Material and
accessory vendor pickers reuse the nullable owner without weakening draft-optional and
order-request-required policy. Parent staging remains coherent across the nested direct-input
X/V lifecycle, and address search stays entirely inside
the WAFL native sheet. The authenticated Next proxy alone calls the official Juso Search API with
the existing server-only `JUSO_API_KEY`; mobile receives only bounded normalized address fields,
ignores stale search responses, and returns to the preserved direct-input draft for detail-address
entry. The rejected Kakao/system-browser/deep-link bridge is removed. No WebView, native package,
EAS input, delivery persistence, or schema is introduced. The document quantity projection remains read-only and collapsed, renders
at most six non-zero cells in canonical display order, and uses a separate full-list sheet beyond
that limit.

The image/attachment action row now owns a small visual-only WAFL action-tile primitive reused
by Size, Color, fabric add, accessory add, document attachment, and Quick Delivery entry points;
each business action remains with its existing feature owner. The document production overview
and selected attachment material read as one container separated only by a weak divider, while
attachment and Quick Delivery remain short icon actions rather than nested tabs. Quick preview
identifies a direct location by its staged place or address, never by the input-mode name.

The latest Design System v2 IA candidate keeps six visible Maker tabs:
`개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`. Overview metrics share one surface
and geometry while editable child controls alone supply one thin underline. Size/Color and
Finished Spec are default-expanded through the shared frozen-axis table and use left-axis row
thresholds for full view. The combined Materials tab keeps separate typed Fabric and Accessory
ownership behind one same-page selected-category switch. This visual variant remains
`OWNER_PHYSICAL_REVIEW_REQUIRED`.

The current Design System v2 matrix/materials-switch review replaces the conflicting four-by-four
preview guidance with one frozen-axis table owner: Color/POM rows use a five-row main threshold,
Size columns remain horizontally scrollable, and the left labels stay fixed. Full view freezes the
corner, Size header, and left labels with synchronized axes. Overview editable controls now own
their single thin underline without a second metric-wrapper underline. `원부자재` remains one
global tab but renders one selected typed Fabric/Accessory list behind a same-page semantic-badge
switch and one category-aware add action. Domain ownership and mutations are unchanged. Status is
`ALPHA64_DS_V2_MATRIX_MATERIALS_SWITCH_IPHONE_REQA_REQUIRED` pending owner physical review.

The current physical-iPhone remediation treats the prior source-only PanResponder PASS as insufficient. `WaflInputSheet` now owns a real 44-point header drag zone behind the 42×4 handle, mounted iOS responder capture, continuous finger-following translation, medium/expanded/dismiss snaps, and explicit bottom-origin enter/exit motion before unmount. Every active bottom-origin Maker editor showing that handle uses the same owner, including reel and frozen-axis bodies. Physical gesture feel remains owner-gated and is never inferred from automation. Finished Spec now uses the actual six canonical major categories to expose practical typed `WAFL 제공` sets plus tenant/category-scoped `우리 회사` items. Null or changed category never mutates existing snapshot rows; explicit V remains the only selection mutation. Additive dev/test-only migration `018` adds nullable category scope while preserving unscoped legacy rows. Status remains `OWNER_PHYSICAL_REVIEW_REQUIRED`; production mutation is zero and APP_VERSION remains alpha.63.

The follow-up physical regression remediation replaces the failed late-acquisition PanResponder path with a dedicated header native responder that captures from touch-down and tracks actual `pageY`. The shared Sheet owner now classifies measured fixed `contentFit`, draggable `expandable`, and near-full `fullView` surfaces; short Saved Spec content no longer inherits the medium-height filler. Overview total quantity structurally uses the same inner metric value surface as editable metrics, with no underline or mutation. The current tenant-scoped process Read owner restores `제작` as the sixth top-level tab without importing `ProductionCardMock`, adding process mutation, or changing schema. All six tab bodies share one canonical top inset. Status is `ALPHA64_PHYSICAL_UI_REGRESSION_REMEDIATION_IPHONE_REQA_REQUIRED`; physical gesture success is not inferred.

The latest shared-sheet stabilization preserves the owner-confirmed first-open drag, slide-up/down, sibling footer frame, Size/Color body inset, and Quick direct-address child-open behavior. All active staged WAFL INPUT consumers route through the one canonical `WaflInputSheet`; the date calendar and fullscreen image remain fixed/non-bottom intentional exceptions. The former outer keyboard avoidance moved the whole expanded root, and stale native animation state could seed the first MOVE after reopen. The owner now keeps the root/detent fixed, shrinks the body against a shared keyboard inset, owns true-bottom body extent, cancels stale animations per open generation, and acquires the stopped visual offset before MOVE. Status is `ALPHA64_SHARED_SHEET_ARCHITECTURE_STABILITY_IPHONE_REQA_REQUIRED`; owner physical re-QA remains required and is not inferred from contracts.

The current focused alpha.64 candidate removes redundant V actions from reusable Size/Color/Spec create children, stages each created option back into its parent selector, and routes Spec child transitions through the canonical close/unmount/reopen handoff. Saved Spec load/save now use shared adaptive measurement, material quantities use one numeric(14,3)-aligned precision owner with an immediate inline reason, numeric keypad mode keeps WAFL PICK reachable, shared body focus reveal owns lower-field keyboard visibility, and Quick direct address no longer asks for a second ambiguous place name. Status target is `ALPHA64_INPUT_SHEET_UX_SEMANTICS_STABILITY_IPHONE_REQA_REQUIRED`; APP_VERSION remains alpha.63 and owner physical re-QA is still required.

The latest focused remediation extends that common reveal owner from a native input point to the complete semantic field block, so Fabric/Accessory lower fields and multiline validation context scroll together without feature-local offsets. Quick partner/direct/Juso transitions now use one close-reset-presentation coordinator for both cancel and selection, preserve the exact origin/destination endpoint through each presentation generation, and defer detail-address focus until the matching returned sheet is mounted. Status target is `ALPHA64_FOCUS_REVEAL_QUICK_NESTED_STABILITY_IPHONE_REQA_REQUIRED`; automated contracts do not infer physical iPhone acceptance.

The current focused Quick remediation routes the dynamic request-preview through that canonical nested coordinator and scopes its adaptive body measurement to the incoming presentation generation. A layout update can no longer cancel the queued entrance frame and strand the child at title height; matching late measurement grows only to a safe usable target without shrinking a user-settled height. One pure policy now routes both origin and destination: direct local staging reopens the prefilled direct editor, while registered or unspecified state opens the picker. Whole-Quick persistence remains deferred and DB/schema/Event/Receipt effects remain zero. Status target is `ALPHA64_QUICK_PREVIEW_STATE_AWARE_ROUTING_IPHONE_REQA_REQUIRED`; owner physical iPhone re-QA remains required.

The current focused input remediation removes the remaining WorkOrder-create exception from the shared sheet policy. `새 작업지시서` uses compact `adaptiveExpandable` geometry and requests product-name focus only after the current presentation generation completes its atomic entrance; raw mount-time auto-focus and fixed form `contentFit` are absent, while X/V create semantics are unchanged. The follow-up table refinement preserves the single frozen-table numeric presentation owner shared by Finished Spec cm/inch and Size/Color quantity, restores the earlier inch value footprint, and now also makes its vertical relationship canonical: a centered `60×34` value surface inside the stable `82×44` cell. The shared one-hairline underline therefore keeps `11` points of horizontal breathing room and a consistent `5`-point centered gap above the bottom grid border; focus changes only color/tint. This owner-accepted underline geometry is now fixed. The latest empty-bootstrap correction keeps the existing `스펙 항목 〉` chooser reachable for editable drafts with zero Finished Spec rows and with a null major category, uses category only to scope recommendations, permits the already-modeled nullable company item, and lets the existing one-batch POM command create the missing measurement snapshot and Size projection. Valid empty state no longer renders the raw repository `not_found` message; issued/locked behavior is unchanged. Status target is `ALPHA64_EMPTY_FINISHED_SPEC_BOOTSTRAP_IPHONE_REQA_REQUIRED`; owner physical iPhone re-QA remains required.

The alpha.64 owner-QA runtime is the cumulative current Maker profile, not a document-only
feature mode. `lib/external-qa/makerQaCapabilities.mjs` is the single semantic capability
owner consumed by internal command guards and the exact Tailscale method/path gate. It keeps
legacy isolated profiles bounded while the current profile includes the finalized overview,
asset, size/color, finished-spec, material/accessory, and document families. The document UI
uses the same live WAFL spacing, typography, color, card, button, and sheet owners as adjacent
tabs, removes redundant framing and permanent ready copy, and requires the explicit
irreversible action `작업지시서 생성`. The current v2 model has no persisted production
category equivalent to the legacy WorkOrder kind fields, so the UI does not infer or store it.

Do not record live PID, port ownership, temporary origin, connection code, session/cookie, full identity hash, credentials, or full WorkOrder UUID in this tracked snapshot.

## Latest feature and architecture baseline

Alpha.63 completes a source/architecture-only stabilization while preserving the accepted
alpha.62 Maker behavior:

- `MobileWorkOrderExperience` is now top-level composition plus session/list/create,
  navigation, and overview coordination; paired material/accessory, asset, and size/spec
  lifecycles have coherent typed feature-controller owners;
- mobile API access is split into session, WorkOrder, material, size/color, measurement, and
  asset modules above the single canonical `apiTransport` request/auth/error owner;
- the current cross-domain `mobileContract.ts` remains intentionally shared because a split
  would increase fan-out and cycle risk without improving ownership;
- shared request identity, inline normalization, mutation queue, pending scope, projection
  reconciliation, picker/Sheet grammar, semantic copy, date, placeholder, and number/unit
  owners are reused, and the new controller/API graph has circular dependency count `0`;
- isolated Runtime measured material success and conflict revalidation. One detail GET plus
  one lifecycle-filtered material-list GET remains bounded debt because command responses do
  not authoritatively own every UI projection;
- applicable contracts, TypeScript, ESLint, Next/Expo builds, import graph, isolated Runtime,
  mutation audit, Canonical Verify, DeveloperAutoConnect, and owner physical-iPhone regression
  QA passed without production, schema/migration, dependency/native/EAS, or product change.

Alpha.62 completes finished-size specification standards, Maker authoring UX, and the
shared mobile input/projection architecture on the alpha.61 baseline:

- additive dev/test migrations `014` and `015` provide system/company versioned size-spec
  templates, independent WorkOrder revision snapshots, persisted cm/inch units and exact
  1/8-inch values, plus same-company reusable size/color options; the applied ledger is
  `15/15`, with no production migration or mutation;
- WorkOrder Size is the only finished-spec size source of truth. System and user-saved
  templates fill only matching sizes, snapshot edits remain independent, and template
  save/update does not reload the WorkOrder matrix/spec projection;
- Maker mobile authoring uses shared typed owners for reels, V/X sheets, semantic choices,
  option grids, nullable normalization, focus transition, serialized mutations,
  command-scoped pending, size/color staged batch selection, projection promotion, and
  paired fabric/accessory copy;
- alpha.60 conditional hard delete and history protection remain intact while size/color
  batch removal, linked quantity cleanup, finished-spec synchronization, and surviving
  matrix totals execute in one tenant-scoped transaction;
- repeated always-mounted vendor/inch reel reopen, set-cell/unit projection reconciliation,
  bounded template apply/save/update refresh, Unicode attachments, material lifecycle, and
  DeveloperAutoConnect passed targeted, isolated Runtime, and owner physical-iPhone QA;
- owner final approval is recorded without modifying or deleting the owner QA fixture.

Alpha.61 completes mobile WorkOrder creation and DeveloperAutoConnect finalization without dependency, schema/migration, native/EAS, R2, PDF/token, or production changes:

- mobile users can create a tenant-scoped editable draft through the canonical WorkOrder command boundary, then add a size, a color, and a quantity cell while preserving expected-version, idempotency, Receipt/Event, and draft-only guards;
- create validation and UI policy share typed canonical owners rather than duplicating API, list, and form behavior;
- the alpha.47 DeveloperAutoConnect path dynamically resolves the current Tailscale IPv4 for Metro advertisement, manifest launch, and development-client launch selection; Windows LAN IPv4 advertisement is a READY failure;
- physical iPhone product QA and a close/reopen automatic DeveloperAutoConnect check passed without manual URL entry or a `192.168.*:8081` selection;
- the exact isolated owner QA WorkOrder was removed in one bounded transaction with mutable residual zero; its Event/Receipt evidence was preserved and all Receipt references were detached by `company_id + command_code + idempotency_key`.

Alpha.60 completes conditional hard delete for eligible WorkOrder-local draft children without dependency, schema/migration, native/EAS, R2, or production changes:

- eligible WorkOrder-local size, color, fabric, and accessory rows in an editable unissued draft use conditional hard delete; normal mobile deletion no longer creates a new archive tombstone;
- size/color deletion physically removes dependent quantity cells and synchronizes the WorkOrder and Revision total from the surviving matrix sum in the same transaction;
- requested, cancelled-after-request, completed, issued-revision, and legacy archived rows remain protected through Revision/Event and order-history rules;
- system/company/master library lifecycle remains separate from WorkOrder-local draft deletion and is not mutated by this flow;
- the legacy material archive schema and routes remain bounded compatibility debt and are neither purged nor dropped;
- the shared-architecture working rule has one canonical Permanent Rules owner in `09a`, with its canonical contract; alpha.51 and alpha.56 evidence remains immutable historical evidence.

The single automated Runtime, owner-approved equivalent isolation gate, Node 24 Canonical Verify, and physical-iPhone QA all passed. The exact owner QA fixture was captured in its accepted final state and removed by one exact isolated cleanup transaction with mutable residual zero while append-only Event/Receipt evidence was preserved.

Alpha.59 extends the completed alpha.58 size/color read-only baseline without a schema migration, dependency/native change, or production mutation:

- draft WorkOrders support tenant- and permission-guarded size, color, and quantity commands with expected-version conflict handling, idempotency, stable IDs, deterministic automatic sorting, and matrix-derived integer total-quantity projection;
- size and color editing uses compact paired actions, sequential immutable multi-add queues, direct color palette selection, stable row selection, and parent/child editor lifecycle that keeps the parent session open after row or palette work;
- production quantity cells update the matrix, WorkOrder total, and revision snapshot transactionally while unchanged saves remain no-ops and finished measurements remain read-only;
- shared circular option reels preserve finite canonical identities, recenter without duplicate callbacks, and support target, category, size, color, and material/accessory unit choices;
- material and accessory names, color/options, usage areas, memos, and unit prices use same-position inline sessions with exact owner identity, stale-blur rejection, submit/blur dedupe, and server-value recovery;
- material required quantity and allowance use quarter-decimal composition while order quantity and amount formulas remain unchanged;
- mobile overview input, cost/image/memo presentation, caret behavior, compact size/color actions, and exact `색상×사이즈` and `완성 치수표` labels are aligned with the shared WAFL interaction grammar;
- read-only WorkOrders retain the accepted `3/3/9/5/15` projection and receive no add, drag, reorder, command, or allowlist action;
- Runtime evidence verified 63 requests, 37 accounting steps, matrix totals `0→3→8→15→16`, Metro manifest/bundle `200/200`, zero fatal aggregation, exact isolated-fixture cleanup, and zero user/migration/R2/production mutation;
- owner physical-iPhone QA accepted the final inline-session, nested editor, caret, circular-reel, matrix-total, and read-only behavior with the result `잘 된다.`;
- alpha.59 adds no size/color archive/restore, fractional total quantity, finished-measurement editing, company color library, Factory scope, schema/migration, dependency/native/EAS change, R2 mutation, or production access.

Final TypeScript, ESLint, Next, Expo, contracts, mutation audit, Canonical Verify, Git, and artifact identities are recorded by the final workflow and matching repo-state.

## Canonical owner structure

- Repository routing: `AGENTS.md`.
- Canonical index and task routing: `docs/project/app-v2/00-start-here.md`.
- Permanent Rules entry point: `docs/project/app-v2/09-codex-working-rules.md`.
- Permanent Rules responsibility owners: `09a` execution lifecycle, `09b` Runtime/data/PC safety, `09c` testing/contracts/handoff, and `09d` Version Delta/finalization.
- Self-executing concise Delta template: `docs/project/app-v2/09e-codex-version-delta-template.md`.
- Current Baseline: this file.
- Current/next roadmap and Version Delta: `docs/project/app-v2/08-roadmap-2.0.md`.
- Device acceptance: `docs/project/app-v2/05-device-test-plan.md`.
- Expo/native environment: `docs/project/app-v2/06-expo-environment-setup.md`.
- External runtime operations: `docs/project/app-v2/41-external-mobile-qa-runbook.md`.
- Normative WorkOrder API contract: `docs/project/app-v2/16-workorder-api-command-read-model-contracts.md`.
- Verification contract: `docs/project/app-v2/17-v2-api-contract-test-plan.md`.
- Historical results: numbered immutable evidence.

## Current evidence

- Alpha.47 developer auto-connect: `docs/project/app-v2/46-mobile-tailscale-serve-developer-auto-connect-evidence.md`.
- Alpha.48 material Read: `docs/project/app-v2/47-mobile-materials-real-read-evidence.md`.
- Alpha.49 canonical instruction architecture: `docs/project/app-v2/48-canonical-codex-instruction-architecture-evidence.md`.
- Alpha.50 material draft create/update: `docs/project/app-v2/49-mobile-material-draft-create-update-evidence.md`.
- Alpha.51 material soft-delete/restore lifecycle: `docs/project/app-v2/50-mobile-material-soft-delete-restore-lifecycle-evidence.md`.
- Alpha.52 mobile core inline UX, calculation, list, and date: `docs/project/app-v2/51-mobile-core-inline-ux-calculation-list-date-evidence.md`.
- Alpha.53 mobile architecture foundation: `docs/project/app-v2/52-mobile-architecture-foundation-evidence.md`.
- Alpha.54 mobile Reel Picker input UX: `docs/project/app-v2/53-mobile-reel-picker-input-ux-evidence.md`.
- Canonical Codex rules documentation maintenance: `docs/project/app-v2/54-canonical-codex-working-rules-normalization-evidence.md`.
- Alpha.55 material order cancellation, zero-order, memo IME, and Runtime QA: `docs/project/app-v2/55-mobile-material-order-lifecycle-evidence.md`.
- Alpha.56 accessory lifecycle parity and physical-iPhone acceptance: `docs/project/app-v2/56-mobile-accessory-lifecycle-parity-evidence.md`.
- Alpha.57 mobile overview, Category, image, and inline input: `docs/project/app-v2/57-mobile-overview-category-inline-input-evidence.md`.
- Alpha.58 mobile size/color read-only foundation and final UX: `docs/project/app-v2/58-mobile-size-color-readonly-evidence.md`.
- Alpha.59 mobile WorkOrder input expansion, quantity matrix, and editor lifecycle: `docs/project/app-v2/59-mobile-work-order-input-expansion-evidence.md`.
- Alpha.60 draft-child hard delete and shared-architecture completion: `docs/project/app-v2/60-draft-child-hard-delete-and-shared-architecture-evidence.md`.
- Alpha.61 mobile WorkOrder create and DeveloperAutoConnect finalization: `docs/project/app-v2/61-mobile-work-order-create-and-runtime-autoconnect-evidence.md`.
- Alpha.62 size measurement standards, saved specs, Maker authoring, and shared mobile architecture: `docs/project/app-v2/62-size-measurement-standards-templates-evidence.md`.
- Alpha.63 mobile architecture stabilization: `docs/project/app-v2/63-mobile-architecture-stabilization-evidence.md`.
- Alpha.64 cumulative Maker WorkOrder/document UX and shared mobile architecture: `docs/project/app-v2/64-maker-workorder-document-ux-evidence.md`.
- Alpha.65 Maker input, Production authoring, Finished Spec visual selector and technical-flat architecture: `docs/project/app-v2/65-maker-input-finished-spec-visual-evidence.md`.
- Alpha.66 WorkOrder identity/lineage, header identity layout, canonical readiness refresh, and accepted final boundary: `docs/project/app-v2/66-workorder-lineage-sample-list-filter-evidence.md` through `docs/project/app-v2/71-workorder-lineage-sample-filter-preissue-evidence.md`.

Older facts remain in their numbered evidence. They are not recopied here.

## Current completion boundary

Current completed result: `2.0.0-alpha.65` — the alpha.64 Maker/document baseline plus
Production process authoring, shared physical WAFL INPUT/PICK and direct-create behavior,
Finished Spec Size SOT and exact cm/inch input, Address Search, and the eight-view visual
Finished Spec selector are finalized. The owner accepted the current garment art only as
provisional release assets. Node 24.14.0 verification, version synchronization, delivery and
finalization are complete. The migration ledger is `18/18`; migration `019`, production
mutation, and owner-fixture mutation remain zero.

Post-alpha.64 policy is explicitly non-destructive: changing or clearing a WorkOrder major
category never deletes or remaps existing Finished Spec rows or measurement values. The new
category changes only future recommendation/default-catalog scope. A future informational
warning may say `대분류가 변경되었습니다. 기존 완성 스펙 항목과 치수를 확인해주세요.`;
the warning is deferred, is not a destructive confirmation gate, and cannot reset data.
Designer-authored replacement of the same eight SVG views is deferred and must not change the
front/back renderer, singular focused preview, 55/55 routing, grid staging or X/V semantics.

The detailed paragraphs below preserve the accepted alpha.62 implementation checkpoints
that led to finalization. Their interim `NOT_EXECUTED` device labels describe those earlier
checkpoints only; the owner subsequently completed and approved the final physical-iPhone QA.

The owner-approved alpha.62 implementation now provides system/company size-spec
templates, independent WorkOrder revision snapshots, persisted cm/inch units, exact
1/8-inch input, mobile apply/save/edit workflows, and bounded dev/test Runtime support.
The measurement UX/structure remediation keeps the finished-spec card open across
unit saves, uses validated decimal cm input and the canonical two-reel integer/eighth-inch
picker, normalizes the canonical POM labels to `총장` / `가슴단면` / `어깨너비`, and exposes
exact source-template `수정됨` state. WorkOrder Size is the only finished-spec size source of
truth: reads project that exact ordered set, template apply fills only the normalized size
intersection, and WorkOrder size create/rename/reorder/delete synchronizes stored spec rows
inside the same command transaction. Spec-only size add/exclude is removed. Current
size/color user wording is `삭제`; hard-delete domain semantics remain unchanged.

The integrated UX/performance remediation replaces the persistent template list with the
compact `스펙 불러오기` flow grouped as `WAFL 추천` and `회사 스펙`, adds explicit
new-template versus immutable new-version save choices plus same-company rename/disable,
and uses the shared outer V/X confirmation grammar. Representative command responses now
carry route/guard/product/DB/statement timing in the approved dev/test Runtime. Mobile
reconciliation reuses authoritative command results and limits blocking follow-up reads to
the projection actually replaced. The measured structure/measurement scenarios dropped
from roughly 2.4–3.0 seconds to roughly 1.0–2.0 seconds while retaining conflict fallback.

The latest bounded remediation replaces both binary template-source and company-save-mode
reels with explicit semantic buttons. Actual system/company templates remain readable
metadata cards. The common iPhone size/color delete `not_found` was traced to two transport
boundaries: the alpha.62 external-QA allowlist omitted item DELETE, and the route still used
the alpha.60-only generic draft-child guard. A dedicated canonical size/color hard-delete
guard now accepts alpha.60 or alpha.62. The same narrow composition is applied to eligible
material hard delete, while archive/restore remains excluded from alpha.62.
The existing alpha.60 physical-delete, linked-quantity cleanup, total synchronization, and
historical-protection repository behavior is unchanged.

Product-equivalent automated Runtime passes template intersection apply/replay, immediate
local cm/inch display with persisted unit, cell/structure modified state, WorkOrder-size SOT
create/delete synchronization, exact reapply reset, fabric/accessory create/patch/order and
eligible hard delete, Korean POM projection, Event/Receipt accounting, and exact
cleanup, including immutable company-template v1 preservation and active v2 selection. A first verification fixture exposed a `text = uuid` source-template read join;
the join now uses the schema-accurate explicit text boundary, and that failed isolated
fixture has zero mutable residual with Event/Receipt evidence preserved. Canonical Verify
passes on the final changed fingerprint. The owner fixture was not changed by this remediation and is currently a draft at version 53
with one cm snapshot, matrix XS/S/M/L/XL/2XL/FREE/테스트사이느, two measurement values, zero
generated documents, and zero public tokens. Owner physical iPhone UX/structure re-QA is
`NOT_EXECUTED`.

The Maker-authoring remediation also verifies the complete mobile mutation
composition for basic fields, size/color/quantity, fabrics/accessories and order lifecycle,
images, attachments, and alpha.62 spec commands. Direct-created size/color values are
same-company reusable catalog options with exact unused deletion or historical-use
deactivation. Mobile material authoring now exposes the canonical same-company partner
picker and maps missing partner and positive-price readiness failures to actionable user
messages. The current shared-input remediation moves nullable text and numeric changed-value
comparison into one typed pure commit-decision owner used by overview, factory memo, and the
paired fabric/accessory editor. Omitted fields remain unchanged, explicit empty text persists
as the canonical clear state, changed blur issues one logical mutation, and unchanged blur
issues none. Unit and inch input share the flat WAFL reel; the rich same-company partner list
uses the shared WAFL InputSheet and V/X grammar. Draft material creation requires a positive
needed quantity and a unit while partner and price stay optional until external-order
readiness. Attachment acquisition normalizes iOS percent-encoded names to NFC and proves an
exact Korean filename JSON/upload/read round trip.

Isolated Runtime proved image/attachment create-read-delete with exact dev/test file cleanup,
nullable fabric/accessory clear persistence, positive-quantity create rejection, actionable
order readiness, 45 requests, 23 detached append-only receipts, 30 preserved events, and zero
mutable business residual. The preserved owner fixture was read only and is draft/draft at
version 82/82 with one snapshot, zero generated documents, and zero public tokens. Owner
physical iPhone shared-input/material UX re-QA remains `NOT_EXECUTED`.

The current batch-selection remediation stages size and color option taps locally. Sheet X
discards the staged set with zero request; sheet V computes one typed set diff and sends one
idempotent batch command. Add-only changes apply directly. A mixed diff asks once about only
the removed product labels and, when applicable, the summed entered quantity removed with
them. The repository validates the complete diff and applies size/color additions, eligible
hard deletes, linked quantity deletion, finished-spec size synchronization, and surviving
matrix totals in one tenant-scoped transaction. Normal user copy contains no cell or
hard-delete implementation language. The same checkpoint standardizes unset overview values
on the shared muted `미지정` display owner, keeps the rich vendor selector in the shared flat
WAFL picker, removes the app-owned numeric submit key, reconciles a successful measurement
unit command without an unrelated projection GET, and uses `사용자 저장 스펙` without exposing
internal template-version labels or policy panels.

The isolated batch Runtime passed local tap/cancel request counts of zero, five batch applies,
one replay, one transaction per changed command, 30-unit size consequence cleanup, 70-unit
color consequence cleanup, finished-spec synchronization, total recalculation, exact fixture
cleanup, and append-only Event/Receipt preservation. Canonical Verify passes under Node
24.14.0 on the final changed set.
The preserved owner fixture remains uniquely owned, draft/draft at version 113/113, with one
snapshot, zero generated documents, and zero public tokens. Owner physical iPhone batch and
saved-spec re-QA is `NOT_EXECUTED`.

The latest bounded iPhone remediation makes the existing target selector and the
metadata-bearing vendor selector share the canonical WAFL scroll/reel option owner. Option
presentation is flat and non-circular, keeps long names readable, and preserves staged X/V
semantics. Equivalent overview and material inline fields use one typed focus-transition
policy and one serialized mutation queue: tapping the next field focuses it immediately,
while a changed or explicitly cleared prior field saves once in entity-version order and an
unchanged prior field performs no mutation. Measurement-unit persistence now owns only its
command-scoped pending state; Size/Color staging remains available and a following command
queues behind the authoritative returned version without a blocking follow-up GET. Size and
Color share one accessible compact option-grid primitive, with four- and three-column default
layouts respectively and separate registered-option sections. User-created template source
copy is now `사용자 저장 스펙` and internal template versioning remains hidden and intact.
The exact owner fixture remains preserved and read-only audited at draft/draft version 127/127,
with zero generated documents and zero public tokens; physical iPhone focus/pending/grid
re-QA is `NOT_EXECUTED`.

The final architecture-cleanup checkpoint routes target and vendor selection through the
same canonical `single-choice-reel` render policy and actual reel column; the rejected
flat-card/list option branch and its adapter are absent. Successful cm/inch persistence now
promotes the current valid matrix/spec bundle to the authoritative next-version cache key
before reconciling the WorkOrder entity version. This prevents the controller effect from
treating that version as not loaded: size-color GET `0`, size-spec GET `0`, unrelated reload
`0`, and unrelated controls remain enabled. Sheet V/X, two-way semantic choices, exact
pending scope, inline transition/queue, and low-level mobile transport each have one typed
owner. Broader domain API-client splitting and wholesale top-level experience decomposition
remain bounded debt because their current cross-feature composition is not equivalent
lifecycle code and a speculative rewrite would increase final-QA risk. Isolated size-spec,
batch-selection, and Maker-authoring Runtime suites passed with exact cleanup. The preserved
owner fixture was read-only audited at draft/draft version 140/140, one snapshot, zero
generated documents, and zero public tokens. Owner physical iPhone final QA is
`NOT_EXECUTED`.

The display version is `2.0.0-alpha.68`; alpha.68 is finalized at
`ALPHA68_FINALIZATION_COMPLETE` with product checkpoint `ALPHA68_COMPLETE` and Owner physical
iPhone result `PASS`. Mobile API calls use typed domain owners above the single
low-level transport, and the top-level Maker experience composes separate material, asset,
size/spec, production, document, Reorder, and session-local delivery foundations while preserving
the accepted alpha.64-alpha.66 behavior. The exact owner fixture remains read-only preserved;
production mutation and new migration remain excluded.

## Completed result — 2.0.0-alpha.67

Result: `2.0.0-alpha.67`

Status: `ALPHA67_FINALIZATION_COMPLETE`.

Accepted product checkpoint: `ALPHA67_REORDER_PDF_BRANDED_SHARE_COMPLETE`.

The owner-approved alpha.67 Version Delta implements Nth Reorder creation/copy and the bounded
detail-entry, post-create reconciliation, and image-derivative corrections summarized at the top
of this baseline. Rework creation and Additional Process Order remain deferred. APP_VERSION stays
alpha.67 after the owner-approved finalization.

The active alpha.67 viewer/share/reset clean-base checkpoint fixes the public viewer shell that
could not hydrate because Tailscale Serve omitted exact `/_next` assets. Viewer loading is now
bounded, native share carries one structured viewer URL, and link rows expose lifecycle/access
metadata. The owner-authorized DEV/TEST reset is manifest-bound: a verified logical backup and
KEEP/DELETE/R2 manifests precede deletion of target-company authored WorkOrder graphs and exact
owned objects. Shared system/reference/template/configuration, unrelated data, document-number
sequences, production, and owner fixtures remain immutable. APP_VERSION remains alpha.66 and
Owner physical result is `PHYSICAL_RESULT_NOT_INFERRED`.

The post-clean-base continuation has implemented every non-viewer physical correction in source:
same-identity image-completion ambiguity reconciliation, immediate Size/Color delete total/spec
reconciliation, Basic Process issue readiness and issue-time auto-completion, shared Material 30/100
limits/counters, Basic Process memo-first factory-delivery truth, and human-readable PDF product
classification. Mobile `보기` no longer falls back to Safari: Expo 55 now uses one native PDF owner
over the existing authenticated internal file route, with native temporary-cache cleanup, internal
back navigation, vertical pages, page count, zoom, and bounded retry. Public `/v` remains share-only
and Save remains actual download. The matching EAS iOS Development Build, owner installation, and
strict runtime restoration remain the device handoff gate. Canonical contracts are `169`; APP_VERSION
remains alpha.66 and physical result is not inferred.
