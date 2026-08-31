# Future Drawing Architecture Guardrails

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
- Alpha.73 production editor work requires a separate approved Delta and is not started by alpha.72 finalization.

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
