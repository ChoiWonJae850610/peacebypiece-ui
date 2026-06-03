# WAFL Button commonization 0.19.38

## Scope

- Added `WaflButton`, `WaflLinkButton`, and `getWaflButtonClassName` as the shared WAFL text/button component layer.
- Kept the existing `AppButton` and `AdminButton` APIs as compatibility adapters so existing screens can move to the WAFL component system without changing call sites all at once.
- Normalized the customer-admin button variants: `primary`, `secondary`, `danger`, `ghost`, `subtle`, and `icon`.
- Normalized sizes: `sm`, `md`, and `lg`.

## Applied areas

- Admin button adapter
- App button adapter
- Partner create buttons
- Storage upgrade button

## Out of scope

- Toast behavior
- Modal shell behavior
- DB/API/R2/attachment/memo/trash flows
- Work order and material order feature logic
