# Future Drawing Architecture Guardrails

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
