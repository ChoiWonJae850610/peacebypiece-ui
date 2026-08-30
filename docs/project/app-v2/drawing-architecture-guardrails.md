# Future Drawing Architecture Guardrails

Status: `PRE_IMPLEMENTATION_ARCHITECTURE_CONTRACT`

This document defines the boundary that future Drawing/Sketch work must enter. It does not approve or implement a Drawing editor, orientation change, dependency, native module, API, schema, migration, PDF behavior, or release.

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

- Drawing UI/editor implementation
- `스케치(준비 중)` behavior change
- drawing dependency or native module
- landscape/orientation policy change
- Scene API/schema/migration
- raster/SVG generation implementation
- PDF/viewer/share integration

Any later Drawing package must route through this contract, the current mobile design-system/input owners, API/security contracts, device plan, and an explicit owner-approved Version Delta.
