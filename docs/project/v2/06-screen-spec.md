# WAFL v2 Screen Spec - First Structure Draft - 0.30.0-alpha.1

## Purpose

This document defines the first screen-structure baseline for WAFL v2.

It is intentionally high-level. Detailed component specs, design tokens, database binding, and permission behavior will be defined in later v2 documents.

## Screen philosophy

WAFL v2 screens should not feel like ERP input pages.

The main screen should feel like a garment production workspace:

- Image/sketch first.
- Sheet centered.
- Card-based information blocks.
- Assistant guidance.
- Order/PDF/share actions in context.
- Mobile card flow as a first-class experience.

## Main workspace structure

The existing 0.24.x three-column mental structure can be reused only after its meaning changes.

```text
Old meaning:
left navigation / center form / right management panel

New meaning:
product exploration / WAFL Sheet / Assistant
```

## PC layout

```text
┌──────────────────────────────────────────────────────────────┐
│ WAFL                                                         │
├──────────────┬───────────────────────────────┬───────────────┤
│ Product       │ WAFL Sheet                    │ Assistant     │
│ Explorer      │                               │               │
│              │ Main image / sketch            │ Next action   │
│ Search        │ Base info card                 │ Missing info  │
│ Filters       │ Fabric cards                   │ Readiness     │
│ Status groups │ Accessory cards                │ Recent events │
│ Recent sheets │ Factory/process cards          │ PDF/share     │
│              │ Size/memo/cost cards            │ Reorder       │
│              │ PDF-like preview                │ Quick actions │
└──────────────┴───────────────────────────────┴───────────────┘
```

### Left: Product Explorer

Purpose:

- Help the user find the garment/style they are working on.
- Not a generic navigation menu.

Contents:

- Search.
- Status filters.
- Due-date filters.
- Product/Style cards.
- Recent Sheets.
- Reorder candidates.
- Draft/incomplete items.

The left area should answer:

```text
어떤 옷을 지금 만들고 있나?
```

### Center: WAFL Sheet

Purpose:

- Main production workspace.
- Screen version of the Sheet/PDF source.

Recommended order:

1. Main image/sketch area.
2. Product name/status/top actions.
3. Base information card.
4. Fabric cards.
5. Accessory cards.
6. Factory/process cards.
7. Size/spec card.
8. Memo/cost card.
9. PDF/share preview card.
10. History summary.

The center area should answer:

```text
이 옷을 만들기 위해 지금 무엇이 정리되어 있나?
```

### Right: Assistant

Purpose:

- Action guide.
- Missing-information detector.
- Readiness and risk panel.
- Quick action surface.

Assistant sections:

- Next action.
- Missing information.
- Order/share readiness.
- Warnings.
- Recent changes.
- Quick actions.

Quick actions may include:

- Generate PDF.
- Share by KakaoTalk/link.
- Request fabric order.
- Request accessory order.
- Send factory instruction.
- Reorder.
- Mark as issue/hold.

The right area should answer:

```text
다음에 무엇을 해야 하나?
```

## Tablet layout

Tablet should not be a squeezed PC layout.

Recommended structure:

```text
Top bar:
- Product/Sheet title
- status
- primary actions

Body:
- WAFL Sheet card flow
- expandable sections

Assistant:
- collapsible side panel or bottom sheet
```

Tablet priority:

1. Read Sheet comfortably.
2. Edit one card at a time.
3. Show PDF/share action clearly.
4. Allow Assistant to appear without permanently taking too much space.

## Mobile layout

Mobile is a one-column card flow.

Recommended order:

```text
1. Main image / sketch
2. Product name / status / primary action
3. Assistant summary
4. Base information card
5. Fabric cards
6. Accessory cards
7. Factory/process cards
8. Quantity / due date / cost summary
9. PDF/share card
10. Recent changes / history
```

Mobile principle:

- Do not force desktop side panels into drawers unless necessary.
- Use cards and bottom sheets.
- Make upload/camera/share actions easy.
- Keep primary actions visible near the relevant card.

## New Sheet creation flow

New Sheet creation should be lightweight.

Recommended wizard:

```text
Step 1. What are you making?
- Product/Style name
- Quantity
- Main image/sketch upload or capture, strongly recommended

Step 2. Basic production info
- Category
- Season
- Color
- Size range
- Due date, optional if unknown

Step 3. Materials
- Fabric card quick add
- Accessory card quick add
- Skip allowed

Step 4. Factory/process
- Factory selection
- Process note
- Skip allowed

Complete
- Create WAFL Sheet
- Assistant lists missing information
```

Minimum creation baseline:

- Product/Style name.
- Quantity.

Strongly recommended but not always required:

- Main image/sketch.

## Card action model

Fabric, accessory, and factory work should happen from cards.

Examples:

```text
Fabric card
- Add fabric
- Set supplier
- Set unit price
- Set usage/quantity
- Request/order fabric
- Mark ordered/received/issue

Accessory card
- Add accessory
- Set supplier
- Set unit price
- Set quantity
- Request/order accessory
- Mark ordered/received/issue

Factory/process card
- Select factory
- Add process note
- Send instruction
- Mark making/issue/done
```

Independent material/order screens can remain, but their role is secondary:

- Inquiry.
- Batch review.
- Supplier grouping.
- Usage history.
- Inventory reference.

## Assistant behavior

Assistant should use risk-based handling.

Risk levels:

```text
info
- Non-blocking guide.
- Example: image is missing, but Sheet can be created.

warning
- Confirm before continuing.
- Example: fabric unit price is missing, but order note can still be sent.

blocking
- Stop the action.
- Example: share link cannot be created for a Sheet the user cannot access.
```

Do not block every incomplete state. Production work often starts before every field is final.

## PDF/share position

PDF/share should be available from:

- Sheet top action area.
- PDF/share card.
- Assistant quick action.

PDF should feel like the output form of the current Sheet, not a separate unrelated export screen.

## Reorder flow

Reorder should be fast.

Expected flow:

```text
Product/Style → latest Sheet → Reorder → confirm quantity/date changes → create new Sheet version
```

Target:

```text
리오더 10초
```

## Screen routes - direction only

Existing routes can remain during transition, but their v2 roles should be adjusted:

```text
/workspace
- Main customer workspace.
- Should eventually center on Product/Style and WAFL Sheet.

/workspace/workorders
- Current workorder route.
- Candidate for v2 transition into WAFL Sheet workspace or compatibility route.

/workspace/material-orders
- Should become secondary inquiry/management, not main flow.

/ui
- WAFL v2 design system showroom.

/functions
- Action code / permission catalog.

/roadmap
- 0.30 v2 roadmap.

/dev/test-console
- Dev/test-only seed, reset, QA, role/account switcher.
- Must remain blocked in production.
```

## First implementation guidance

Do not implement this entire screen spec in one Codex run.

Recommended later order:

1. `/ui` v2 showroom mock components.
2. Static WAFL Sheet mock.
3. Static Assistant mock.
4. Static mobile card flow mock.
5. Data model/type draft.
6. Permission/action code catalog.
7. Prototype workspace route behind dev/test guard or feature flag.
8. Real DB/API binding only after the design and data model are stable.
