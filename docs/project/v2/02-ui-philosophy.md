# WAFL v2 UI Philosophy - 0.30.0-alpha.2

## Purpose

This document defines the UI behavior philosophy for WAFL v2 before implementation.

The goal is to prevent Codex or future patches from recreating a form-heavy ERP screen under a new design skin. WAFL v2 should feel like a clothing-production workspace where the user is working on one garment/style through a living Sheet.

## Core UI statement

```text
WAFL v2 UI = product exploration + living WAFL Sheet + Assistant guidance
```

The screen should help the user answer three questions quickly:

```text
1. 어떤 옷을 지금 만들고 있나?
2. 이 옷을 만들기 위해 무엇이 정리되어 있나?
3. 다음에 무엇을 해야 하나?
```

## Product feeling

WAFL v2 should avoid the feeling of:

- ERP dashboard first.
- Accounting software.
- Database admin console.
- Generic inventory management.
- A long form that must be completed before work can start.

WAFL v2 should feel like:

- A visual production workspace.
- A digital working Sheet.
- A card-by-card production checklist.
- A place where images, materials, factory instructions, PDF/share, and reorder belong to the same garment.

## Layout meaning

The existing three-column structure may be reused only with a changed meaning.

```text
v1 meaning:
left menu / center workorder form / right management panel

v2 meaning:
Product Explorer / WAFL Sheet / Assistant
```

The right side is not a control panel. It is an Assistant.

The center is not an input form. It is a living Sheet.

The left side is not a generic menu. It is the place to find the garment/style being worked on.

## Image-first rule

Representative product image, sketch, and visual references are core data.

They must not be treated as low-priority attachments.

Screen priority:

1. Product image/sketch.
2. Product/Style name and status.
3. Main next action.
4. WAFL Sheet cards.
5. PDF/share and reorder actions.
6. History and audit details.

Attachments are a lower-level concept. The product image/sketch is a first-class production object.

## Card-first rule

Users should not feel that they must fill a large form from top to bottom.

Use cards to create a progressive production flow:

- Base information card.
- Image/sketch card.
- Fabric card.
- Accessory card.
- Factory/process card.
- Size/spec card.
- Cost summary card.
- PDF/share card.
- History card.

Each card should have its own readiness state and relevant actions.

## Assistant behavior

Assistant must behave as a guide, not as a blocker by default.

Assistant responsibilities:

- Show the next best action.
- Show missing information.
- Explain whether the Sheet is ready for order/share/production.
- Show recent changes.
- Provide quick actions.
- Warn before risky actions.

Risk handling:

```text
info
- Non-blocking guide.
- Example: image is missing, but the Sheet can be created.

warning
- Require confirmation before continuing.
- Example: fabric unit price is missing, but the user still wants to send a provisional order note.

blocking
- Stop the action because it is unsafe or unauthorized.
- Example: the user cannot generate a share link for a Sheet outside their company.
```

## Role-sensitive UI rule

Do not branch UI by role name directly.

Bad direction:

```ts
role === "designer"
```

Correct direction:

```ts
can(user, "sheet.update", sheet)
can(user, "fabric.order", sheet)
can(user, "pdf.share", sheet)
```

The visible UI should be derived from action permissions and Sheet context, not from hardcoded role labels.

## PC principle

PC can use three columns:

- Product Explorer.
- WAFL Sheet.
- Assistant.

PC should be optimized for overview, editing, and production coordination.

## Tablet principle

Tablet should not be a squeezed PC view.

Tablet should prioritize:

- Comfortable Sheet reading.
- One-card-at-a-time editing.
- Collapsible Assistant.
- Easy image/PDF/share access.

## Mobile principle

Mobile should be a first-class card flow.

Mobile order:

1. Image/sketch.
2. Product name/status/action.
3. Assistant summary.
4. Base information.
5. Fabric.
6. Accessory.
7. Factory/process.
8. Quantity/due date/cost summary.
9. PDF/share.
10. History.

Do not force desktop panels into mobile drawers unless the drawer has a clear mobile purpose.

## PDF-like Sheet principle

WAFL Sheet and PDF should not feel unrelated.

The user should be able to understand:

```text
현재 화면의 Sheet가 PDF로 정리되어 공유된다.
```

The PDF preview should be visually connected to the Sheet structure, but not every interactive card detail must appear in the PDF.

## Do / Don't

### Do

- Keep the product image visible and important.
- Use cards to reduce input pressure.
- Put actions near the relevant card.
- Let users create a Sheet before every detail is complete.
- Use Assistant to explain missing information.
- Make reorder and PDF/share visible.
- Design mobile as its own card flow.

### Don't

- Do not make the screen feel like a database admin page.
- Do not make every field mandatory at creation.
- Do not hide all actions inside a top-right menu.
- Do not treat image/sketch as a generic attachment.
- Do not build permission logic around hardcoded role names.
- Do not make independent fabric/accessory order screens the main flow again.

## Implementation boundary

This document is a design baseline only.

It does not authorize:

- UI implementation.
- DB migration.
- API changes.
- Production behavior changes.
- Existing route rewrites.

Later `/ui` showroom work should implement static visual samples based on this philosophy and the future `07-design-system.md` document.
