# 0.22.01 iPad mini modal and mobile material order cleanup

## Summary
- Compact tablet modal panels now use centered modal sizing even when the CSS width is below Tailwind `md`.
- Material order target sheet is closed before opening the order-line add modal to avoid nested Radix Dialog focus/pointer conflicts on mobile.
- Material order mobile-only status summary card was removed from the detail panel.
- Tablet material order target modal no longer forces a tall minimum body height.

## QA
- iPad mini portrait: open material order target and add a material order line. The add modal should be centered, not full-screen sparse.
- iPad mini landscape: modal should remain centered.
- Mobile: in the material order line add modal, quantity and unit price inputs should focus and accept values.
- Mobile material order detail: the extra status card above the summary header should not appear.
- Build: run `npm run build` locally.
