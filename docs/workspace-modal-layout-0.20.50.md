# 0.20.50 WAFL workspace/modal layout correction

## Scope
- Re-align workspace content width by removing the remaining scroll-frame right padding that made content cards look shorter than the shared WAFL header.
- Keep material-order PC/tablet headers in the same client WAFL header pattern while correcting compact tablet landscape layout.
- Raise the common modal layer above mobile sheets/drawers and reinforce pointer handling so buttons are hit-tested on the modal rather than the background.
- Normalize workorder category, manager, and inventory modals to a top-close + bottom-right apply action pattern.

## Notes
- Mobile can keep fullscreen modal presentation.
- Tablet/desktop keep centered modal presentation through the existing ModalShell/BaseModal responsive classes.
- Drawing modal remains separate and keeps its top-layer behavior.
- No status transition, permission, API, DB, R2, attachment, memo, trash, or purge flow changes were made.
