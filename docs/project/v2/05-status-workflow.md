# WAFL v2 Status Workflow - 0.30.0-alpha.3

## Purpose

This document defines the first WAFL v2 status/workflow baseline.

It is a design contract, not an implementation file. It does not authorize DB migration, API changes, UI rewrites, seed mutation, or production behavior changes.

## Core rule

WAFL v2 must separate whole-Sheet status from card status.

Bad pattern:

```text
One long global workorder status tries to describe every fabric, accessory, factory, inspection, and PDF state.
```

Required pattern:

```text
Product / Sheet has a lifecycle status.
Each card has its own card_status.
Assistant summarizes what is missing and what can happen next.
```

## Status philosophy

WAFL should behave like a smart assistant, not a rigid gatekeeper.

```text
Warn when information is missing.
Confirm when risk exists.
Block only when the action would be invalid, destructive, insecure, or misleading.
```

Examples:

```text
원단 단가가 없습니다. 그래도 발주할까요? -> warning + confirm
공장 거래처가 없습니다. 공장 지시서를 공유할 수 없습니다. -> block
납기일이 없습니다. 공장 전달 전에 입력하는 것을 권장합니다. -> warning
```

## Product lifecycle status

`products.lifecycle_status` should describe the product/style at a high level.

Suggested values:

```text
active
archived
cancelled
```

Optional future values:

```text
sample
selling
discontinued
```

Rules:

- Keep product lifecycle simple.
- Most production movement belongs to Sheet status, not Product status.
- Archive is preferred over destructive delete.

## Sheet status

` sheets.status ` should describe the current production stage of a WAFL Sheet.

Baseline values:

```text
draft
ready
ordered
making
inspection
completed
hold
cancelled
```

### draft

Meaning:

```text
Sheet exists but is incomplete.
```

Typical conditions:

```text
- Created with minimal product name/quantity.
- Missing fabric, accessory, factory, due date, or other information.
- Assistant should show missing information.
```

Allowed next movement:

```text
draft -> ready
draft -> hold
draft -> cancelled
```

### ready

Meaning:

```text
Sheet has enough information to proceed.
```

Typical conditions:

```text
- Basic product information exists.
- Required card information is acceptable.
- Some warnings may still remain.
```

Allowed next movement:

```text
ready -> ordered
ready -> hold
ready -> cancelled
ready -> draft
```

### ordered

Meaning:

```text
Fabric/accessory/order-related actions have started.
```

Allowed next movement:

```text
ordered -> making
ordered -> hold
ordered -> cancelled
```

### making

Meaning:

```text
Factory/process production is in progress.
```

Allowed next movement:

```text
making -> inspection
making -> hold
making -> cancelled
```

### inspection

Meaning:

```text
Inbound/inspection/defect confirmation is in progress.
```

Allowed next movement:

```text
inspection -> completed
inspection -> making
inspection -> hold
```

### completed

Meaning:

```text
Sheet production cycle is done.
```

Allowed next movement:

```text
completed -> reopened by explicit permission only
completed -> reorder creates new Sheet, not direct mutation
```

### hold

Meaning:

```text
Work is paused.
```

Allowed next movement:

```text
hold -> draft
hold -> ready
hold -> ordered
hold -> making
hold -> inspection
hold -> cancelled
```

Rules:

- Returning from hold should require the previous stage or selected target stage.
- Hold reason should be captured as event metadata.

### cancelled

Meaning:

```text
Sheet is cancelled.
```

Allowed next movement:

```text
cancelled -> reopened by owner/admin only
```

Rules:

- Cancel is not the same as delete.
- Cancel must create an event.

## Sheet status transition table

```text
from        to allowed by baseline
draft       ready, hold, cancelled
ready       ordered, hold, cancelled, draft
ordered     making, hold, cancelled
making      inspection, hold, cancelled
inspection  completed, making, hold
completed   reopen only by explicit permission
hold        previous/selected valid stage, cancelled
cancelled   reopen only by explicit permission
```

## Card status

`sheet_cards.card_status` describes each card's readiness/progress.

Baseline values:

```text
empty
draft
ready
requested
ordered
received
issue
done
skipped
```

### empty

No useful data yet.

### draft

Some data exists but card is incomplete.

### ready

Card has enough information for its next action.

### requested

A request has been created but not accepted/ordered/fulfilled.

Examples:

```text
fabric order requested
factory instruction requested
```

### ordered

The card's order or external work has been sent.

### received

Material or result has been received.

### issue

There is a defect, missing data, late delivery, quantity mismatch, or other problem.

### done

Card work is complete.

### skipped

Card is intentionally not needed.

Rules:

- `skipped` requires reason/event.
- Card status must not silently override Sheet status.
- Assistant should summarize card statuses.

## Card-specific status usage

### Basic info card

```text
empty -> draft -> ready -> done
```

Missing information:

```text
product name: block creation
quantity: block creation or require default depending future rule
due date: warning before factory/share
category: warning
```

### Image/sketch card

```text
empty -> draft -> ready -> done
```

Rules:

- Main image/sketch is strongly recommended but not always required.
- Assistant should warn if missing.

### Fabric card

```text
empty -> draft -> ready -> requested -> ordered -> received -> done
                          -> issue
```

Warnings:

```text
missing unit price
missing supplier
missing quantity
missing color/spec
```

Blocks:

```text
cannot order without supplier
cannot order without item name
cannot receive negative quantity
```

### Accessory card

```text
empty -> draft -> ready -> requested -> ordered -> received -> done
                          -> issue
```

Same warning/block style as fabric.

### Factory/process card

```text
empty -> draft -> ready -> requested -> ordered -> done
                          -> issue
```

Warnings:

```text
missing due date
missing unit work price
missing process detail
```

Blocks:

```text
cannot share factory instruction without factory/recipient
cannot complete negative or impossible quantity
```

### Inspection card

```text
empty -> draft -> ready -> received -> issue -> done
```

Rules:

- Defect quantity and accepted quantity must be auditable.
- Completing inspection may move Sheet to `completed` if all required cards are done.

### PDF/share card

```text
empty -> ready -> requested -> done
                -> issue
```

Meaning:

```text
empty: no PDF generated
ready: Sheet can generate PDF
requested: PDF generation/share in progress
done: PDF snapshot/share completed
issue: generation/share failed or link revoked/expired
```

## Assistant status summary

Assistant should derive a user-facing summary from Sheet and card states.

Examples:

```text
"원단 카드 2개 중 1개가 발주 가능 상태입니다."
"부자재 단가가 없어 발주 전 확인이 필요합니다."
"공장 지시서 공유 전 납기일 입력을 권장합니다."
"검수 수량이 생산 수량과 다릅니다."
```

Assistant should classify each message:

```text
info
warning
confirm_required
blocked
```

## Blocking policy

### Usually warn, not block

```text
missing image
missing category
missing unit price
missing due date before early draft share
missing memo
```

### Confirm before proceeding

```text
fabric/accessory order with missing price
PDF/share with missing non-critical fields
reorder from older Sheet
status jump that skips an expected intermediate stage
```

### Block

```text
cross-tenant access
production-only forbidden dev/test action
missing recipient for external share
invalid quantity
negative received quantity
revoked or expired share link access
permission denied action
destructive action without confirmation
```

## Status events

Every status transition should create an event.

Event examples:

```text
sheet.status.update
sheet_card.status.update
fabric.order
accessory.receive
factory.progress.update
inspection.complete
pdf.generate
pdf.share
```

Event payload should capture:

```text
previous_status
next_status
actor
reason
related_card_id
warning_override if any
timestamp
```

## Reorder behavior

Reorder should not directly reset a completed Sheet.

Recommended behavior:

```text
Product
  -> completed Sheet v1
  -> reorder creates Sheet v2
```

Rules:

- Source Sheet should remain immutable except for explicit admin correction.
- New Sheet should copy useful cards.
- Assistant should show what was copied and what should be re-confirmed.

## PDF/share status relationship

PDF is a snapshot.

Rules:

- Generated PDF should reference source Sheet and source hash/version.
- If Sheet changes after PDF generation, Assistant should warn: PDF may be outdated.
- Sharing should create an event and share link record.
- Expired/revoked link access must be blocked.

## Implementation boundary

This document does not require immediate implementation.

Future implementation may create:

```text
lib/internal/v2-status.ts
lib/internal/v2-status-transitions.ts
lib/internal/v2-assistant-rules.ts
docs/project/v2/status-transition-table.md
```

Only after explicit implementation approval.

## Open decisions

No blocking owner decision is required for this checkpoint.

Recommended defaults:

```text
Use simple Sheet statuses.
Use richer card statuses.
Use Assistant to summarize missing/blocked/confirm-required actions.
Use event logs for every status transition.
Treat reorder as new Sheet creation.
```
