# WAFL responsive foundation 0.21.38

## Scope

0.21.38 freezes the first responsive rule for Add, Empty and Upload dashed boxes before moving to material-order UI finalization.

## Rule

- Empty states use `WaflEmptyCard` with `shape="control"` by default.
- Add/upload slots use `WaflAddCard` or `WaflAddCardButton` with `shape="control"` by default.
- PC, tablet and mobile should differ by `density`, not by custom `rounded`, `border`, `bg` or ad-hoc min-height values.
- Upload/drop zones may keep drag/drop state classes, but shape must come from the WAFL primitive.

## Density

- `compact`: mobile/tablet tight rows or narrow panels.
- `default`: normal add slot / empty slot.
- `spacious`: large empty section in work-order detail.

## Updated targets

- Common `WaflEmptyCard`, `WaflAddCard`, `WaflAddCardButton`.
- Work-order attachment/design upload slots.
- Work-order material/process add slots.
- Work-order mobile/tablet material empty/add slots.
- `/ui` Foundation primitive samples.

## Deferred

- Member permission modal row/detail polish.
- Personal settings modal tone polish.
- Storage trash detail summary polish.
- Full tablet/mobile page-by-page visual pass.
