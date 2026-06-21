# Modal layer and touch policy — 0.22.06

## Layer order

- AppSheet overlay/content: `z-[2000]`
- BaseModal/ModalShell root: `z-[3000]`
- Drawing editor exceptional top layer: isolated explicit override only

Feature screens must not raise ordinary modal z-index values. A sheet is closed before an ordinary modal is opened when the two actions are connected.

## Touch and focus

- Confirm actions use the normal button `click` event.
- Do not add feature-specific `pointerdown`, forced `blur`, delayed unlock, or duplicate submit handlers.
- Touch devices do not receive automatic modal focus or focus restoration.
- Desktop retains focus trapping and Escape handling through `useModalEnvironment`.

## Scroll lock

- `ModalShell` uses the common document scroll lock.
- `lockBodyPosition={false}` may be used when a mobile virtual keyboard makes fixed-body locking unstable; overflow and overscroll remain locked.
- AppSheet uses Radix Dialog's lifecycle and its own scrollable content area.

## Sheet-to-modal transition

The material-order target sheet closes first. The add-item modal opens on the next animation frame, preventing two interactive layers from remaining active during the same touch sequence.
