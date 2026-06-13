# 0.22.02 Modal positioning and mobile add stability

- Re-centered common BaseModal from the small-tablet breakpoint so iPad mini and Galaxy Tab use centered modal layout.
- Removed the CSS override that conflicted with modal animation transform and could push tablet modals to the wrong position.
- Prevented mobile add confirmation from colliding with focused number inputs by blurring active input before confirm.
- Normalized order quantity and unit price before confirming material order line additions.
