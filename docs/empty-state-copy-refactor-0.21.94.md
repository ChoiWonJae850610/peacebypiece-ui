# 0.21.94 Empty State copy refactor

## Scope
- Material order empty-state copy was centralized in `materialOrderEmptyStates.ts`.
- Selection states use `~ 선택해 주세요`.
- Missing-data states use `~ 없습니다`.
- The material order summary empty state now uses `WaflEmptyWorkspaceState` instead of a local paragraph.

## Deferred
- Broader work order process/material card extraction remains for 0.21.95.
- Full responsive visual regression is deferred by request until the refactor batch is complete.
