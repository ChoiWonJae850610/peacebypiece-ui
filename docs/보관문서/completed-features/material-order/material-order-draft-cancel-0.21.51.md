# 0.21.51 Material order draft cancel action

## Goal

Make draft material orders removable from the list without hard-deleting database rows.

## Rules

- The `새 발주서 생성` button continues to create a draft row immediately.
- Draft orders can be cancelled from the list card action menu.
- The action label shown to users is `삭제`.
- The server stores the result as `status = cancelled`.
- Cancelled orders remain available through the existing `취소` status filter.
- Non-draft orders cannot be cancelled from the list card action menu.

## UI

- Material order cards now use the same `...` action pattern as work order cards.
- The status badge is moved under the title/primary line area.
- The menu opens on the card's top-right `...` button.
- Choosing `삭제` asks for confirmation, then moves the draft order to cancelled status.
- If the cancelled order is currently selected, the center and right panels return to the unselected state.
