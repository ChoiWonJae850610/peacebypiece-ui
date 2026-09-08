# Future Drawing Architecture Guardrails

## Final alpha.75 boundary

- `ALPHA75_FINALIZATION_COMPLETE` accepts the authenticated DEV/TEST Product Sketch overlay palette, Selection/Delete,
  partial stroke Eraser, exact transient feedback, and one-release/one-history-entry semantics on Scene schema v1.
- Owner actual iPhone and iPad-mini QA is `PASS`, including Save/close/reopen with at most one alpha.75 Save per device;
  iPad-mini orientation regression is `0`. Regular/Large iPad and Android remain `NOT_RUN`.
- Move/transform, zoom/pan, image underlay, pressure, PDF/export integration, and Production Sketch remain deferred.
  Release/production remains intentionally disabled as `스케치(준비 중)`.

## Alpha.75 overlay palette and stroked-vector partial-eraser boundary

- `ALPHA75_OVERLAY_PALETTE_STROKE_ERASER_IPHONE_IPAD_QA_REQUIRED` supersedes the freehand-only product Eraser while
  preserving Selection + Delete as the sole whole-object deletion path. Eraser affects freehand, line, arrow shaft and
  renderer-derived head, and unfilled rectangle/ellipse visible strokes. Text and filled future shapes are immune.
- Each supported semantic vector has deterministic WORLD stroke components. A touched element is replaced in-place by
  surviving Scene-v1 freehand fragments; an untouched element retains its semantic kind. Rectangle uses four ordered
  sides, arrow uses shaft/left-head/right-head, and ellipse uses a bounded clockwise polyline with a canonical top start.
- Screen radius is `0.7` of the shared minimum touch target, converted by viewport scale and frozen for the gesture.
  The exact WORLD radius owns both the projected ring and swept-capsule clipping. Device/model pixels and adjustable
  radius remain absent.
- Pointer move owns only trail, ring, and derived preview. Release performs at most one Scene/history commit; Undo
  restores exact original kinds/ids/order/geometry and Redo restores the flattened Scene. Schema/API/network writes do
  not gain eraser metadata.
- The authoring palette is an icon-only vertical absolute overlay anchored to the selector. It cannot author layout
  height or canvas reflow; outside canvas dismissal consumes the press. Seven top-level controls and accessibility
  semantics remain. Move/transform, zoom/pan, image, pressure, PDF/export, schema/migration, and Production exposure
  remain out of scope. Physical PASS is not inferred.

## Alpha.75 partial eraser and compact-toolbar boundary

- `ALPHA75_PARTIAL_ERASER_COMPACT_TOOLBAR_IPHONE_IPAD_QA_REQUIRED` supersedes whole-object Eraser. Selection + Delete
  remains the only whole-object removal path; Eraser affects only freehand/Pen elements.
- One eraser gesture is an ordered WORLD trail. Each trail segment forms a swept capsule against visible freehand
  stroke width, preventing gaps between sparse pointer samples. Release replaces each touched stroke with deterministic
  zero/one/many freehand fragments in original z-order and creates one Scene/history commit; one Undo restores exact
  original ids/order/points and Redo restores the exact fragment Scene.
- The first surviving fragment retains the source id; additional fragments use the existing editor Drawing-id owner.
  Fragments shorter than the canonical active-stroke sampling distance are dropped. Scene schema stays v1 and adds no
  eraser or fragment kind.
- Pointer move owns only a thin exact-radius ring and a derived preview Scene. Canonical Scene/history/network/
  persistence/export mutation remains `0/0/0/0`; line, arrow, rectangle, ellipse, and text receive no eraser highlight
  or mutation.
- The top toolbar is seven icon-only, accessible controls. Pen/line/arrow/rectangle/ellipse/text live in one current-
  authoring-tool menu; Selection and Eraser remain independent. `선택 객체 삭제` uses `Trash2`, while `전체 지우기`
  uses the distinct existing `BrushCleaning` icon. Move/transform, partial vector erasure, adjustable radius, zoom/pan,
  image, pressure, and PDF/export remain out of scope. Physical PASS is not inferred.

## Alpha.75 eraser visual-feedback correction boundary

- `ALPHA75_ERASER_VISUAL_FEEDBACK_IPHONE_IPAD_REQA_REQUIRED` adds only presentation feedback to the accepted
  whole-object eraser: a thin cursor ring on pointer down/move and accumulated derived outlines for current candidates.
- Cursor radius is the canonical WORLD hit tolerance projected through the current viewport scale; the shared spacing
  token supplies only a bounded visibility floor. There is no device/model-specific radius or adjustable eraser size.
- Cursor and candidate ids remain React editor state projected in the non-interactive transient SVG layer. They do not
  alter canonical element styles or enter Scene/history/API/persistence/export, and are cleared by release, cancel,
  viewport-invalidated gesture, tool switch, close, or reopen.
- Pointer move remains Scene/history/network `0/0/0`; release retains one unique whole-object set and one history
  commit, with freehand splitting `0` and one-Undo z-order restoration. Physical visual PASS is not inferred.

## Alpha.75 selection and whole-object eraser boundary

- `ALPHA75_SELECTION_HITTEST_OBJECT_ERASER_IPHONE_IPAD_QA_REQUIRED` adds only single selection, selected-object Delete,
  and whole-object eraser to Product Sketch. Move/resize/rotate, endpoint editing, partial erasing/path splitting,
  multi-select/lasso, zoom/pan, image underlay, pencil pressure, PDF/export, and Production gate changes remain deferred.
- `lib/domain/drawing/hitTest.ts` is the pure WORLD-coordinate owner. It uses deterministic WORLD tolerance, reverse
  ordered Scene elements for topmost selection, polyline/segment distance, arrow shaft/head geometry, visible-border
  semantics for unfilled rectangle/ellipse, and deterministic semantic text bounds. React Native, viewport pixels, and
  device classes do not participate.
- Selected id, selection outline, eraser swept candidates, and eraser gesture points are editor-only transient state.
  They are absent from Scene serialization, API payloads, history snapshots, and reopen state.
- Selection itself mutates Scene/history/network `0/0/0`. Selected Delete commits one local Scene/history entry. One
  completed eraser gesture removes its unique targeted whole elements in one local Scene/history entry; pointer move
  and cancel mutate `0/0/0`, and Undo restores original z-order.
- Scene schema stays v1, migration stays `22/22`, explicit Save remains the only network mutation owner, and alpha.74
  WORLD/viewport/orientation/responsive/Static Sheet boundaries remain unchanged. Physical PASS is not inferred.

## Final alpha.74 boundary

- `ALPHA74_FINALIZATION_COMPLETE` accepts the authenticated DEV/TEST Product Sketch tool set `펜 / 선 / 화살표 /
  사각형 / 타원 / 텍스트`, mixed history, explicit Save/reopen, and safe dirty discard on Scene schema v1.
- Owner actual iPhone and iPad-mini QA accepts portrait/open continuity, compact native zero-motion, touch/render
  alignment, mixed Undo/Redo, and the single iPad Save/close/reopen editable WORLD Scene.
- Alpha.74 deferred selection/eraser/object delete until the bounded alpha.75 candidate above. Move/transform, zoom/pan,
  image underlay, pencil pressure, and PDF/export remain deferred. Release/production remains intentionally disabled as
  `스케치(준비 중)`.
- Regular/Large iPad and Android actual-device results remain `NOT_RUN`; their orientation matrix is preserved by
  source/contracts and is not inferred physical PASS.

## Alpha.74 Product Sketch portrait policy

- Product Sketch is portrait-only on handset, compact tablet, and regular/large tablet. Its React Native fullscreen Modal
  declares portrait only and registers a declarative scope with the single runtime orientation owner.
- On close, handset and compact tablet remain portrait-only; regular/large tablet regains general WAFL portrait+landscape
  permission without a forced landscape rotation.
- Device classification uses orientation-invariant physical-screen short side and no model-name branch. The stable
  responsive Recipe detail host remains required for regular/large tablet rotation.
- This UI policy does not change the canonical WORLD `1000 x 1400`, viewport transform, inverse input mapping, Scene v1,
  SVG renderer, history, persistence, or stale-gesture cancellation.

## Alpha.74 iPad responsive detail-subtree continuity correction

- A responsive window-width change may alter list/detail layout, but it must not replace the active selected Recipe
  detail lifecycle owner. The detail host keeps one stable key under one stable responsive-workspace parent.
- `WorkOrderDetailOverview`, its current tab, `WorkOrderImageGallery`, local `sketchVisible`, and an open Product Sketch
  remain mounted across tablet/phone-like breakpoint transitions while the selected Recipe is unchanged.
- Rotation alone invokes no Sketch close, Decision, Save, Scene/history/network mutation, or tab reset. Canvas viewport
  recompute and stale active-gesture cancellation remain the only Drawing-local resize response.
- The stable detail-host architecture, other fullscreen surfaces, Drawing schema/API, dependency/native/config/EAS, and
  migration remain unchanged. The later compact-tablet/Product Sketch portrait policy supersedes only the earlier
  all-tablet/all-Sketch orientation allowance. Physical PASS is not inferred from the stable-host contract.

## Alpha.74 iPad Sketch fullscreen orientation-lifecycle correction

- Owner physical iPhone portrait authoring is PASS with its one Save consumed. Owner iPad rotation in both directions
  closed Product Sketch before geometry QA and before any iPad Save, so iPad remains a re-QA gate.
- This historical correction first aligned Product Sketch with the then-current all-orientation iPad allowance. The later
  alpha.74 product policy supersedes the surface contract to portrait-only while native iPad metadata remains broad enough
  for regular-tablet general WAFL rotation.
- Rotation alone does not own close, navigation, Save, Scene/history/network mutation, or dirty Decision semantics.
  The exact native callback that caused the prior dismissal is not asserted without trace evidence.
- Canvas layout still advances viewport generation, cancels an in-flight cross-layout gesture, and reprojects the same
  WORLD Scene. Other fullscreen surfaces are backlog-only and unchanged in this bounded correction.

## Alpha.74 responsive shape-authoring boundary

- The authenticated DEV/TEST Product Sketch toolbar is `펜 / 선 / 화살표 / 사각형 / 타원 / 텍스트`; eraser, selection,
  movement, resize, zoom/pan, image underlay, pencil, and PDF/export integration remain deferred.
- Rectangle and ellipse use one pure renderer-independent bounded-shape session. Start/end are clamped WORLD points;
  normalized bounds are independent of drag direction. Active updates are preview-only, release above the WORLD minimum
  commits one Scene element/history entry, and cancel/termination/tool switch commits zero.
- A material canvas viewport-layout change advances a Drawing-local generation and cancels active pen, line, arrow,
  rectangle, ellipse, or pending pre-sheet text input. A presented text session keeps its immutable WORLD anchor and draft.
- Scene v1, stable element identity/order, uniform contain-fit projection, inverse screen-to-world input, explicit Save,
  independent Drawing version, and the alpha.73 dirty-close lifecycle remain canonical. Viewport size/orientation is never
  persisted or used to rewrite geometry.
- The toolbar may wrap responsively, but no device-specific coordinate, renderer dependency, WaflInputSheet architecture,
  native/EAS, schema, migration, image/PDF/R2, or Production behavior is introduced.

## Alpha.73 first product vertical slice

- The authenticated development Draft surface uses exact product label `스케치`; release keeps disabled
  `스케치(준비 중)` until separately approved finalization.
- `WorkOrderSketchEditor` consumes the alpha.72 Scene, authoring, history, viewport, projection, and SVG owners. It does
  not redefine the canonical world or renderer.
- Explicit Save is the only persistence boundary. Dirty is serialized Scene relative to the authoritative saved
  baseline; Undo, Redo, and Clear stay local until Save.
- The editor has no header X. Its PDF Viewer-pattern bottom `닫기`, Android hardware back, and modal dismiss request
  resolve through one dirty-aware close owner. Clean close exits immediately; dirty close uses the canonical WAFL
  Decision; discard never invokes Save or overwrites the persisted Scene.
- A nested dirty Decision must finish its own sheet/native-Modal close lifecycle before the confirmed discard resolves
  onto the guarded parent close. One discard invokes the parent close once; no decision backdrop may survive the editor.
- `work_order_drawings` is revision-owned and slot-addressable, allowing later multiple drawings while alpha.73 exposes
  one `primary_sketch`. Its version is independent of WorkOrder `entity_version`.
- No Drawing derivative, R2 object, representative image, output include, PDF, Viewer, Share, or export path exists.

### Final alpha.73 boundary

- `ALPHA73_FINALIZATION_COMPLETE` accepts the authenticated DEV/TEST Product Sketch vertical slice: pen, line, arrow,
  text, mixed history, explicit Save/reopen, and safe dirty discard.
- Release/production remains intentionally disabled as `스케치(준비 중)`. Finalization does not expose the editor in
  Production and does not add derivative, image, PDF, Viewer, Share, R2, or export integration.
- Drawing Scene v1's additive text element and migration 022 remain the complete alpha.73 persistence boundary. No
  follow-on schema or Production migration is implied.

### Alpha.73B apparel annotation tools

- Product toolbar exposure is exactly `펜 / 선 / 화살표 / 텍스트`; foundation rectangle/ellipse remain hidden and eraser,
  selection, movement, resize, image, zoom/pan, pressure, color, and thickness controls remain deferred.
- Pen retains the accepted midpoint-quadratic-v1 rendering, raw WORLD points, `1.5` WORLD-unit sampling, transient active
  stroke, and one release Scene/history commit.
- Line and arrow use one renderer-independent transient segment. Pointer movement changes only the transient preview;
  release over the WORLD-unit minimum creates one ordered Scene element/history commit. Arrow canonical data is start/end
  plus style, and its head is a deterministic SVG renderer derivative in start-to-end direction.
- Text is additive to Drawing Scene schema version 1 as semantic WORLD anchor, bounded single-line content, WORLD font size,
  and basic style. Existing v1 scenes remain readable without row rewrite or migration. Screen coordinates, measured boxes,
  SVG paths, and viewport-derived geometry are never persisted.
- Canvas tap opens the shared WAFL direct-input sheet. Empty/whitespace text cannot confirm. Valid confirm closes the child
  sheet first, then commits one text element/history entry; cancel commits none and never closes the parent Sketch modal.
- Mixed pen/line/arrow/text history, explicit Save/reopen, Clear/Undo, dirty baseline comparison, and the alpha.73A2
  child-before-parent discard lifecycle use the existing owners unchanged.

Status: `FOUNDATION_ARCHITECTURE_CONTRACT`

This document defines the boundary that Drawing/Sketch work must enter. The owner-approved alpha.72 Foundation remains
the framework-free, renderer-independent domain owner under `lib/domain/drawing`. Alpha.72C selects the existing SVG adapter
after Owner physical comparison and optimizes only the isolated authenticated development-bundle authoring lab. It does not
approve a production Drawing editor, persistence, API, schema, migration, PDF behavior, export, or release.

## Final alpha.72 product boundary

- The customer-facing feature name is `스케치`.
- Renderer, SVG, Performance, and PoC labels are diagnostics for the authenticated DEV lab only.
- Production remains disabled as `스케치(준비 중)`; finalization does not activate an editor.
- `ALPHA72_DRAWING_FOUNDATION_COMPLETE` closes the reusable foundation, native/runtime orientation, selected SVG adapter,
  transient authoring, freehand display, and committed-cache boundary only.
- At the alpha.72 checkpoint, Alpha.73 production editor work was not started. The authenticated DEV/TEST editor above
  is the later separately approved Delta and does not enable a Production editor.

## Current foundation owner

- `lib/domain/drawing/contracts.ts` owns the canonical canvas, Scene/element types, camera, viewport, and transform contracts.
- `lib/domain/drawing/scene.ts` owns strict canonical cloning, validation, serialization, and parsing.
- `lib/domain/drawing/viewport.ts` owns uniform contain-fit and inverse world/screen transforms.
- `lib/domain/drawing/history.ts` owns bounded editable Scene undo/redo state, never raster snapshots.
- `lib/domain/drawing/authoring.ts` owns renderer-independent transient active-stroke sampling and finalization in world coordinates.
- `lib/domain/drawing/adapters.ts` owns narrow library-independent future renderer/editor/export boundaries.
- The alpha.72C SVG performance lab consumes this foundation only behind the authenticated development-bundle gate. Production
  `스케치(준비 중)` stays disabled.

## Alpha.72B renderer-comparison boundary

- Existing `react-native-svg` and SDK55-compatible `@shopify/react-native-skia` are isolated mobile renderer adapters.
- Both consume the same `DrawingSceneV1`, renderer-neutral projected primitives, camera, viewport transform, and shared
  built-in PanResponder input path.
- Renderer toggle, render, workload selection, and drawing are in-memory only and may not mutate WorkOrder, DB, R2,
  document, or PDF state.
- No renderer is selected by automated evidence. Owner physical comparison is required.
- Library-specific types remain outside `lib/domain/drawing` and outside persisted Scene contracts.

## Alpha.72C selected renderer and authoring boundary

- Owner physical comparison selects `react-native-svg`; Skia is no longer a package, source adapter, or product candidate.
- The library-independent renderer adapter remains the stable boundary. SVG-specific types stay in the mobile adapter.
- A committed `DrawingSceneV1` contains completed elements only. One transient active stroke is separate from Scene,
  serialization, history, persistence, and business state until pointer release.
- Pointer movement converts screen input through `screenToWorld()`, applies the deterministic `1.5` world-unit minimum-distance
  policy, and updates only the active stroke. First/final points and order are preserved.
- The committed projected frame is reusable while Scene, camera, and viewport are unchanged. The active stroke is projected
  independently. Release performs one Scene/history commit; cancel performs none.
- The SVG performance lab remains authenticated and development-bundle-only. Production `스케치(준비 중)` remains disabled.

## Alpha.72C-1 freehand display and render-cache boundary

- Raw ordered `DrawingSceneV1` freehand world points remain canonical editable truth; smoothing never rewrites them.
- `midpoint-quadratic-v1` is a deterministic display derivative shared by active and committed SVG rendering. It inserts no
  points, preserves exact endpoints, is tangent-continuous at internal joins, and cannot overshoot the local point hull.
- The accepted `1.5` world-unit sample threshold is unchanged. Average/maximum accepted world gaps are diagnostics only.
- The committed projected frame, committed path elements, and committed SVG subtree are one memoized boundary. The active
  stroke is a separate memoized boundary and may not invalidate committed work during pointer movement.
- Pointer movement performs committed Scene/history mutation and committed projection/path/layer rebuild `0`; release remains
  one Scene commit and one history commit.
- No interpolation, dependency, schema, persistence, API, R2, PDF, or production Sketch authority is introduced.

## Current media boundary

- Current Maker media is persisted WorkOrder images plus PDF attachments.
- `WorkOrderMediaBoundary` is the typed screen boundary for those existing projections and actions.
- `MobileWorkOrderExperience` may assemble and pass that boundary. It must not own Drawing scene, selection, tool, viewport, gesture history, undo/redo, or export state.
- Image authoring, attachment authoring, and their shared projection/version reconciliation remain separate internal owners behind one authoritative mutation gate.
- A Drawing export may enter the current image/PDF pipeline only through an explicit adapter. It must not bypass image integrity, revision ownership, expectedVersion, idempotency, R2, or issued-document rules.

## Logical world and viewport

- The editable Drawing Scene is the sole source of truth.
- The Scene uses one fixed logical world-canvas coordinate system independent of device pixels, screen size, safe area, and orientation.
- Phone/tablet size or orientation changes affect only the viewport transform. They never rescale or rewrite stored Scene geometry.
- Zoom and pan update only the viewport transform. They never mutate stored object geometry.
- Every pointer/touch coordinate enters the Scene through the inverse screen-to-world transform before hit testing, selection, or editing.
- Device dimensions must never become logical canvas dimensions or persistent object coordinates.

## Scene, derivatives, and export

- Editable Scene data stays distinct from raster/SVG derivatives.
- Raster and SVG outputs are deterministic derivatives, never the editable source of truth.
- Persistence and compatibility must preserve stable Scene identity/version separately from generated derivatives.
- Export is a bounded adapter operation into the existing media/document pipeline. It does not grant Drawing authority over representative-image, output-include, PDF, viewer, share, or issued snapshot semantics.
- A third-party drawing library, if later approved, remains behind a WAFL adapter. Library-specific scene/tool/viewport types must not leak into the WorkOrder page shell, API contracts, or persisted domain without separate owner approval.

## Explicitly deferred

- production Drawing UI/editor implementation
- production `스케치(준비 중)` behavior change
- Drawing dependency beyond existing `react-native-svg`
- landscape/orientation policy change
- Scene API/persistence schema/migration
- raster/SVG generation implementation
- PDF/viewer/share integration

Any later Drawing package must route through this contract, the current mobile design-system/input owners, API/security contracts, device plan, and an explicit owner-approved Version Delta.
## Alpha.73B-1 text-entry presentation and preview correction

- A Product Sketch text session owns one immutable WORLD anchor and one monotonically increasing local session identity.
- Raw mount-time `autoFocus` is forbidden for the nested Sketch text sheet. Focus is requested once from the current
  session's shared `WaflInputSheet.onAfterOpen` presentation-ready boundary; stale session callbacks are ignored.
- The insertion crosshair and typed ghost text are renderer-only transient primitives. They do not become Scene elements,
  history commits, persistence payloads, or network effects. Confirm creates one semantic text element from the exact same
  WORLD anchor after child close; cancel or tool switch creates zero.
- While a text session is active, a second canvas tap is ignored until that session closes. Stacked input sheets are forbidden.

## Alpha.73B-2 shared keyboard transition and text caret

- The A73B-1 order remains `WORLD anchor/session → sheet presentation complete → focus → keyboard`; raw autofocus,
  delay timers, and focus polling remain forbidden.
- Keyboard show never moves the direct-input sheet to an unconditional detent. The shared WAFL INPUT owner measures the
  complete focused semantic block, scrolls available body content first, and applies only the remaining minimum rise within
  the native keyboard transition. Already-visible fields add zero sheet movement. Hide restore and user-drag authority remain.
- The pending Sketch text marker is one compact neutral vertical caret projected from the immutable WORLD anchor. The former
  horizontal crosshair and brick-orange treatment are absent. Caret and ghost remain transient renderer primitives with
  Scene/history/persistence/network mutation zero; confirm uses the same anchor and cancel removes both.

## Alpha.73B-3 shared keyboard visibility reconciliation

- Sketch Text keeps the B1 presentation boundary and delegates final visibility to the shared WAFL INPUT owner. The final
  keyboard frame merges a theme-owned minimum usable body floor with mounted semantic reveal; Drawing code does not own a
  local detent or keyboard offset.
- Final `keyboardDidShow` reconciliation is guarded by open, focus, and measurement identity. It changes no Scene, history,
  persistence, or network state, and cannot replace the neutral WORLD caret or ghost/final anchor contract.

## Alpha.73B-4 coordinated direct-input entrance

- Sketch Text opts into the shared prepared-auto-focus boundary: the child Modal, sheet layout, and registered text target are
  ready before its session-scoped focus request, but the ordinary resting sheet is not shown first.
- The keyboard will-change frame drives the first visible entrance to the shared B3 merged target. Drawing owns no detent,
  offset, tolerance, or local fallback. Final didShow verification, ordinary hide restore, and close-generation invalidation
  remain shared WAFL INPUT responsibilities.
- The neutral WORLD caret, ghost/final anchor equality, text session identity, Scene/history/network zero-mutation preview,
  mixed persistence, and A73A2 child-before-parent dismissal stay unchanged.

## Alpha.73B-5 prepared local geometry

- Sketch Text uses the same shared geometry-complete prepared boundary as other coordinated direct inputs. Its semantic
  field block publishes sheet-local bounds before focus; Drawing owns no keyboard-frame measurement, target, offset, or
  animation policy.
- The shared first keyboard-frame handler synchronously resolves the compact composition/visibility target and starts one
  native-timed entrance. Did-show measurement remains safety reconciliation only; any meaningful rise is a first-target
  miss. The caret, ghost, anchor, Scene/history/network, Save/reopen, and parent-close contracts remain unchanged.

## Alpha.73B-6 did-show semantic reconciliation

- Drawing remains a consumer of the shared WAFL INPUT owner and adds no local keyboard offset, tolerance, or animation.
- Final did-show measurement classifies actual field and compact action/footer visibility. Visible settling never moves the
  whole sheet; actual clipping keeps bounded scroll-first correction and residual rise. Queued reconciliation is invalidated
  by hide/close generation changes.
- B5 prepared local geometry and synchronous first target, the neutral WORLD caret/ghost, Scene/history/network zero-mutation
  preview, mixed persistence, and A73A2 parent-close lifecycle remain unchanged.
