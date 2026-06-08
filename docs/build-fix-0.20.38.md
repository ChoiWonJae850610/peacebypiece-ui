# 0.20.38 build fix

## Scope
- Fix TypeScript build failure introduced in 0.20.37 drawing touch fallback.
- Keep mobile/tablet drawing behavior changes from 0.20.37.

## Fix
- Add `getEraserCursorFromCanvasPoint` helper used by touch-based eraser cursor updates.
- Convert canvas-space touch point into display-space eraser cursor coordinates.

## Non-goals
- No DB/API/R2/schema changes.
- No permission or status transition changes.
