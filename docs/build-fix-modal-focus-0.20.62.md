# 0.20.62 build fix and process modal focus guard

## Scope

- Fixed the 0.20.61 TypeScript build error in `WorkOrderProcessEditSheet.tsx`.
- Added mobile/tablet focus guards to the newly introduced process edit modal inputs.

## Details

- `translateWorkOrderDisplayText` requires a supported `Locale` type, so the process edit sheet now passes `locale` as `Locale` instead of a generic string.
- Numeric and text inputs in the process edit modal now use `enterKeyHint="done"` and suppress Enter-driven focus jumps.
- Before applying a process edit, the active modal element is blurred to reduce stale mobile keyboard/focus state.
- Select changes blur the active element before updating draft state.

## Unchanged

- No API changes.
- No DB schema changes.
- No R2, attachment, memo, trash, purge, permission, or workflow transition changes.
