# WAFL v2 Product Definition - 0.30.0-alpha.1

## Product definition

WAFL v2 is a card-based clothing-production workspace for Dongdaemun-style apparel production.

It helps a company create, update, share, reorder, inspect, and complete a garment/style by keeping the production sheet, image/sketch, fabric, accessories, factory/process work, PDF/share output, and history in one connected workspace.

## Product phrase

```text
WAFL v2 = 옷 하나를 만들기 위한 카드형 제작 워크스페이스
```

## What WAFL v2 is not

WAFL v2 is not primarily:

- ERP.
- Accounting software.
- A generic inventory program.
- A form-heavy workorder input screen.
- A file attachment manager.

WAFL v2 can contain inventory, cost, PDF, and order functions, but those functions exist to support the clothing-production workspace, not to become the main product identity.

## Core value

WAFL v2 should make these actions faster than paper or chat-only workflows:

- Create a new production Sheet quickly.
- Attach or capture garment images/sketches naturally.
- Add fabric/accessory/factory information card by card.
- Share a production-ready PDF or link.
- Reorder an existing style.
- See what is missing before production/order/share.
- Track changes without manually searching chat history.

## Success criteria

The first product success criteria are:

1. New Sheet creation within 1 minute.
2. Reorder within 10 seconds from an existing Product/Style.
3. Product image/sketch is easy to add and easy to see.
4. Fabric/accessory/factory actions feel connected to the garment, not separate modules.
5. PDF/KakaoTalk sharing feels like a natural Sheet action.
6. Mobile and tablet flows are usable for field work.
7. A first-time user can identify the next main action without instruction.

## Core objects

WAFL v2 uses three core object levels:

```text
Product / Style
└─ WAFL Sheet
   └─ Sheet Card
```

## Product / Style

A Product/Style is the top-level business object.

Meaning:

- One garment/style that the company designs, produces, reorders, or tracks.
- Examples: shirring one-piece dress, pleated skirt, striped shirt, wide pants.

Recommended naming:

- DB/development language: `Product` / `products`.
- User-facing Korean language: `제품` or `스타일`.
- Product context may use `스타일` when the apparel-industry feeling matters.
- Admin/system/data context may use `제품` when clarity matters.

Main fields, conceptually:

- Product name.
- Season.
- Category.
- Main image.
- Brand/line, if needed.
- Internal style code, if needed.
- Lifecycle status.
- Latest Sheet.
- Reorder history.

Role:

- Search target.
- Reorder basis.
- Image/sketch home.
- Long-term history anchor.
- Future statistics anchor.

## WAFL Sheet

A WAFL Sheet is the central screen/document object.

Meaning:

- A production Sheet for a Product/Style.
- A living digital version of a workorder.
- The source for PDF and share output.
- A workspace where users fill garment production information over time.

User-facing wording:

- App framing: `WAFL Sheet`.
- Field/PDF wording can still include `작업지시서`.
- Example PDF title: `WAFL 작업지시서`.

Main fields, conceptually:

- Sheet number.
- Version.
- Quantity.
- Due date.
- Colors.
- Sizes.
- Notes.
- Main image/sketch references.
- Sheet cards.
- Status.
- PDF snapshot references.
- Share link references.
- Events/history.

Role:

- Main workspace surface.
- PDF source.
- Share source.
- Action hub.
- Production status home.

## Sheet Card

A Sheet Card is a piece of work inside a WAFL Sheet.

Card types:

- Image/sketch card.
- Base information card.
- Fabric card.
- Accessory card.
- Factory card.
- Process card.
- Size card.
- Memo card.
- Cost card.
- PDF/share card.
- History/event card.

Role:

- Prevents the Sheet from feeling like one huge input form.
- Lets users add information gradually.
- Makes order/share/update actions happen in context.
- Supports mobile card flow.
- Supports Assistant checks for missing or risky information.

## Assistant

Assistant is not a generic right panel. It is the action guide for the current Product/Sheet.

Assistant responsibilities:

- Show the next recommended action.
- Detect missing information.
- Show whether order/share/PDF is ready.
- Summarize recent changes.
- Provide quick actions.
- Warn, confirm, or block only when the business risk requires it.

Assistant principle:

```text
Assistant = guide, not controller.
```

## Creation principle

New Sheet creation must be lightweight.

Confirmed baseline:

- Minimum required: product name and quantity.
- Strongly recommended: main image/sketch.
- Optional at creation: fabric, accessory, factory, detailed cost, full size spec, final due date if unknown.

After creation, Assistant should show missing information instead of forcing a long upfront form.

## Order principle

Fabric/accessory/factory/order actions should live primarily in Sheet cards.

Independent order/material screens may remain as secondary views for:

- Inquiry.
- Management.
- History.
- Supplier-based grouping.
- Inventory or usage review.

They must not become the main v2 workflow.

## PDF/share principle

PDF is not a detached export result. It is a natural output of the current WAFL Sheet.

The Sheet should be structured so that:

- Screen content and PDF content feel connected.
- Users can preview PDF-like content from the Sheet context.
- Share actions are reachable from the Sheet/Assistant.
- PDF snapshot and share history can be tracked.

## Role and permission principle

WAFL v2 must not branch UI and business logic directly by role name.

Bad pattern:

```ts
if (role === "designer")
```

Preferred pattern:

```ts
can(user, "sheet.update", sheet)
can(user, "fabric.order", sheet)
can(user, "pdf.share", sheet)
```

The detailed permission action-code catalog will be defined in a later v2 document.

## Status principle

WAFL v2 should separate overall Sheet/Product status from card-level status.

Conceptual overall statuses:

- `draft`
- `ready`
- `ordered`
- `making`
- `inspection`
- `completed`
- `hold`
- `cancelled`

Conceptual card statuses:

- `empty`
- `ready`
- `requested`
- `ordered`
- `received`
- `issue`
- `done`

The detailed workflow will be defined in a later v2 document.

## v2 product boundary

The first v2 product boundary should focus on:

- Product/Style search and creation.
- WAFL Sheet creation and editing.
- Image/sketch as first-class data.
- Fabric/accessory/factory cards.
- Assistant missing-info and next-action guidance.
- PDF/share flow.
- Reorder flow.
- Event/history capture.
- Action-code based permissions.

Lower priority until the core is stable:

- Advanced analytics.
- Complex billing operation UI.
- Deep system-admin refinements.
- Large R2 cleanup UI improvements.
- Highly granular approval chains.
