# 0.21.66 WAFL modal/validation/list width correction

## Summary
- WAFL modal backdrop click close is disabled by default to prevent accidental tablet dismissals.
- Material order line edit modal now relies on the header close button and primary apply action only.
- Material order status transition now uses the shared workflow validation modal before moving past draft when required fields are missing.
- Work order and material order list card horizontal padding was aligned to the same list shell width basis as the create button.

## Notes
- Modal close remains available through the header close button and explicit action buttons.
- Material order blocking issues prevent transition; warning issues allow confirmation.
