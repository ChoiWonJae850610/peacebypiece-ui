# WAFL v2 Screen Spec - Design System Connected Draft - 0.30.0-alpha.5

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


## Korean role set

v2 alpha planning uses four Korean-first roles:

```text
시스템관리자(system_admin)
고객사 관리자(customer_admin)
디자이너(designer)
재고관리(inventory_manager)
```

Screen labels should use Korean first. English codes are internal implementation values.

## Role-based screen scenarios

These are planning scenarios. Actual visibility must later be controlled by action codes, not hardcoded role names.

### 고객사 관리자(customer_admin) scenario

고객사 관리자는 고객사 workspace를 열어 전체 제품/Sheet 진행, 위험, 비용, 멤버/권한을 확인한다.

Primary screen needs:

- Product/Style search and status grouping.
- Incomplete Sheet list.
- Due-date risk.
- Cost visibility where allowed.
- Member/permission access through settings.
- Assistant exception summary.

### Designer scenario

The designer opens the workspace to create or update a Sheet.

Primary screen needs:

- Fast new Sheet action.
- Image/sketch upload or capture.
- Base information editing.
- Fabric/accessory/factory intent cards.
- Draft PDF preview.
- Reorder action.
- Missing-info guidance without excessive blocking.

### 재고관리(inventory_manager) scenario

재고관리는 입고, 검수, 불량, 재고 반영을 처리하기 위해 workspace를 연다.

Primary screen needs:

- Inspection/inbound queue or filter.
- Fabric/accessory receive state.
- Received quantity input.
- Defect/issue quantity input.
- Issue photo/note.
- Inventory reflection action if allowed.
- Completion action if allowed.
- Recent changes and issue flags.

Production/factory readiness can still appear as Sheet/card information, but v2 alpha does not require a separate production-manager role by default.

### 시스템관리자(system_admin) scenario

The system admin does not use the customer workspace as a normal customer member.

Primary screen needs remain under `/system`:

- Customer companies.
- Signup/onboarding.
- Plan, billing, and storage state.
- System standards.
- Audit logs.
- Dev/test-only support tools where allowed.

## Workflow-to-screen mapping

| Workflow | Main screen area | Assistant role | Secondary screen |
| --- | --- | --- | --- |
| New Sheet | Product Explorer + WAFL Sheet wizard | Missing information after creation | None required |
| Fabric order | Fabric card | Readiness/warning/confirm | Material inquiry/batch view |
| Accessory order | Accessory card | Readiness/warning/confirm | Material inquiry/batch view |
| Factory instruction | Factory/process card + PDF/share card | Production readiness | Partner/factory management |
| Inspection/inbound | Inspection filter or Sheet card | Issue/completion readiness | Inventory/history view |
| Reorder | Product/Style detail or Sheet top action | Reused/missing data summary | Product history |
| PDF/share | Sheet top action + PDF/share card | Share readiness and risk | Files/history view |

## Mobile role scenarios

Mobile should be optimized for the action happening now:

- Designer: capture image, edit base info, send draft/share.
- 고객사 관리자: approve exception, check progress, review cost/risk.
- 재고관리: enter received/defect quantity, attach photo, mark done.
- 디자이너: capture image, edit base info, send draft/share.

Mobile should not expose every admin function as a cramped list. Deep settings can remain PC/tablet-first unless required for field work.

## 0.30.0-alpha.4 screen implications from Neon/R2/Korean roles/status

The screen model must reflect the new data, permission, and status baselines.

### Data binding implication

The central Sheet should not render as one large form.

Recommended screen/data mapping:

```text
Product / Style header
  -> products

WAFL Sheet frame
  -> sheets

Card shell
  -> sheet_cards

Fabric card details
  -> sheet_fabric_cards

Accessory card details
  -> sheet_accessory_cards

Factory/process cards
  -> sheet_factory_cards / sheet_process_cards

Images/sketches/files
  -> files

PDF/share card
  -> pdf_snapshots / share_links

Assistant and history
  -> card statuses / sheet status / events
```

### Permission implication

Buttons and panels should not be shown/hidden by hardcoded role names.

Screen actions should map to action codes:

```text
Create Sheet -> sheet.create
Edit Sheet -> sheet.update
Order fabric -> fabric.order
Share PDF -> pdf.share
Invite member -> member.invite
Run dev reset -> dev.reset.run
```

The future `/functions` route should present this action-code catalog, not a generic feature list.

### Status implication

The UI must show both Sheet status and card status.

```text
Sheet status / Sheet 상태:
초안(draft) / 준비됨(ready) / 발주됨(ordered) / 제작중(making) / 검수중(inspection) / 완료(completed) / 보류(hold) / 취소(cancelled)

Card status / Card 상태:
비어있음(empty) / 작성중(draft) / 준비됨(ready) / 요청됨(requested) / 발주됨(ordered) / 입고됨(received) / 이슈(issue) / 완료(done) / 건너뜀(skipped)
```

Assistant should translate these into user-facing next actions:

```text
- 부족한 정보
- 발주 가능 여부
- 확인 필요 경고
- 차단된 액션
- 최근 변경
```

### Blocking implication

UI should not block every incomplete case.

Recommended UI behavior:

```text
info -> show hint
warning -> show yellow/soft warning
confirm_required -> ask user to confirm
blocked -> disable action with clear reason
```

This screen behavior must be consistent across PC, tablet, and mobile.



## 0.30.0-alpha.4 clarification

This patch clarifies that:

- Neon remains the current DB platform.
- Cloudflare R2 remains the current file/PDF/image storage platform.
- User-facing roles are Korean-first: 시스템관리자, 고객사 관리자, 디자이너, 재고관리.
- Internal role codes are secondary implementation values.
- User-facing statuses are Korean-first, with English DB/API codes in parentheses.
- Production and inspection are not separate default roles in v2 alpha unless the owner later decides to split them.


## `/ui` showroom requirement - 0.30.0-alpha.5

Before rewriting the real workspace, `/ui` should show the v2 visual language with non-production sample data.

Required showroom sections:

```text
1. Brand / token overview
2. Buttons
3. Cards
4. Sheet layout sample
5. MaterialCard / AccessoryCard / FactoryCard
6. StatusBadge with Korean labels
7. AssistantPanel / NextActionCard
8. Upload/Image area
9. Modal / Drawer / Toast
10. Mobile card stack
11. PDF-like Sheet preview
```

Implementation rules for the later `/ui` patch:

- Keep the route dev/internal guarded as it already is.
- Use mock/sample data only.
- Do not connect to Neon or R2.
- Do not mutate production or dev data.
- Do not rewrite `/workspace/workorders` in the same patch.
- Use `docs/project/v2/07-design-system.md` as the design source of truth.


## PDF/share screen baseline - 0.30.0-alpha.6

PDF/share is treated as part of the WAFL Sheet screen model.

### PC Sheet placement

The central WAFL Sheet should expose PDF/share in two places:

```text
1. Sheet-level PDF/share card
   - 작업지시서 PDF
   - 발주요청 PDF
   - 공장전달 PDF
   - 최근 생성/공유 이력

2. Assistant action area
   - PDF 생성 가능 여부
   - 부족한 정보
   - 공유 전 확인
   - 카톡용 문구 복사 / 링크 공유
```

### Card-level placement

PDF/share actions may also appear inside relevant cards:

```text
원단 카드:
- 발주요청 PDF 생성
- 거래처 공유

부자재 카드:
- 발주요청 PDF 생성
- 거래처 공유

공장 카드:
- 공장전달 PDF 생성
- 공장 공유
```

### Mobile placement

Mobile should make sharing a short flow:

```text
Sheet 열기
-> Assistant 공유 상태 확인
-> 공유 버튼
-> PDF 종류 선택
-> 부족 정보 확인
-> 링크/문구 생성
-> 카톡 또는 기기 공유
```

### Required screen rules

- Do not expose raw R2 URLs.
- Do not expose R2 object keys.
- Do not show internal token values.
- Show Korean-first labels.
- Show whether a PDF is current or stale after Sheet changes.
- Show share link expiry/revocation state.
- Keep external recipient handling link-based in alpha.
