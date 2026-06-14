# WAFL modal focus/input policy 0.22.08

## Purpose
Prevent iPad and mobile Safari from losing actionable hit targets after a software keyboard is dismissed inside a WAFL modal.

## Common policy
- Never blur an input during `pointerdown` or `touchstart`.
- Interactive controls (`input`, `textarea`, `select`, `button`, links and role buttons) keep native event order.
- A tap on non-interactive modal space may dismiss the keyboard only after the click has completed.
- Keyboard dismissal is deferred by one animation frame so the initiating tap finishes before the visual viewport changes.
- Document scroll locking uses fixed body/overflow/overscroll containment, but does not set `body.style.touchAction = "none"`.
- Modal panel scrolling remains `touch-pan-y` and `overscroll-contain`.
- Closing a modal may still blur the active element as final cleanup.

## Screen-specific rule
Individual work-order, material-order and inventory modals must not add their own pointer/touch blur workarounds. Validation and numeric parsing remain screen responsibilities; focus and keyboard dismissal remain common modal responsibilities.

## Regression targets
- Inventory inbound, adjustment and deduction quantity inputs.
- Work-order material/process/basic-information modals.
- Material-order line add/edit modals.
- iPad mini landscape, tablet portrait/landscape and mobile portrait.
- First tap on Apply/Close after keyboard dismissal.
