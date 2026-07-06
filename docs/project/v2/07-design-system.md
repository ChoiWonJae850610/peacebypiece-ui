# WAFL v2 Design System - Figma-style Reference - 0.30.0-alpha.5

## Purpose

This document defines the first WAFL v2 design-system baseline before implementation.

WAFL v2 design should not copy the attached concept image directly. The image is a moodboard. This document is the implementation standard. `/ui` will become the live showroom where Codex implements visible samples after the design rules are stable.

## Design-system principle

```text
문서 = 디자인 시스템 규칙
/ui = Figma 대체 쇼룸
Codex = 문서 기준 구현자
컨셉 이미지 = 무드보드 / 방향 참고
```

Design work must proceed in this order:

1. Product and workflow definition.
2. Design-system document.
3. `/ui` showroom component samples.
4. Workspace prototype.
5. Production implementation.

Do not implement a large workspace redesign before `/ui` confirms the component language.

## Moodboard use rule

The attached concept image may be used only as direction reference.

Use the image for:

- ERP feeling removal.
- Soft card-based layout.
- Light background.
- Subtle accent color use.
- Central Sheet-first composition.
- Product Explorer / WAFL Sheet / Assistant possibility.
- Material/accessory/factory work as card actions.
- Tablet/mobile extension direction.

Do not use the image as:

- Exact color specification.
- Exact typography specification.
- Exact spacing/radius/shadow specification.
- Component-size contract.
- Layout pixel contract.
- Final UI to copy.

## Brand direction

WAFL should feel like:

```text
의류 제작 워크스페이스
살아있는 작업지시서
디자이너와 생산 담당자가 같이 보는 제작 카드
사진과 스케치가 먼저 보이는 업무 공간
```

WAFL should not feel like:

```text
ERP
회계 프로그램
데이터베이스 관리자 화면
재고 숫자만 보는 관리 화면
긴 입력폼
```

Design keywords:

- Clean.
- Light.
- Card-based.
- Image-first.
- Calm.
- Production-ready.
- Mobile-friendly.
- Korean business-readable.

## Color tokens - first draft

Final color values can change after `/ui` showroom review. The first rule is semantic consistency, not exact color obsession.

Recommended token names:

```text
background.page
background.surface
background.subtle
background.elevated

border.default
border.strong
border.focus

text.primary
text.secondary
text.muted
text.inverse

accent.primary
accent.primarySoft
accent.secondary
accent.warning
accent.danger
accent.success
accent.info

status.draft
status.ready
status.ordered
status.making
status.inspection
status.completed
status.hold
status.cancelled
```

Usage principle:

- Page background should be light and calm.
- Surface cards should be white or near-white.
- Accent colors should guide actions, not dominate the page.
- Status colors must be readable with text labels. Do not rely on color alone.
- Danger color is only for destructive or irreversible actions.

## Typography

The app is Korean-first. Typography must prioritize Korean readability.

Recommended hierarchy:

```text
Display / page title
- screen title or product name

Section title
- WAFL Sheet section title

Card title
- fabric card, accessory card, factory card

Body
- normal text and form labels

Caption
- metadata, helper text, timestamps

Numeric
- quantity, unit price, totals, R2 usage, storage capacity
```

Rules:

- Do not use overly decorative fonts.
- Do not make important Korean labels too small.
- Numeric data must align clearly.
- Use font weight to create hierarchy before adding more colors.

## Spacing

Spacing should reduce the ERP feeling.

Recommended scale names:

```text
space.1
space.2
space.3
space.4
space.5
space.6
space.8
space.10
space.12
```

Rules:

- Cards need enough inner padding to feel like editable work blocks.
- Dense tables are allowed only in secondary management screens.
- Main WAFL Sheet should prefer breathing room over maximum data density.
- Mobile card spacing must be comfortable for thumb interaction.

## Radius and shadow

Recommended token names:

```text
radius.sm
radius.md
radius.lg
radius.xl
radius.pill

shadow.none
shadow.card
shadow.popover
shadow.modal
```

Rules:

- Main cards should have moderate radius.
- Do not overuse heavy shadow.
- Use border + subtle shadow instead of strong floating panels.
- Modal and drawer elevation may be stronger than card elevation.

## Icon rule

Icons are supportive, not primary meaning.

Rules:

- Always pair important icons with text labels.
- Do not use icon-only buttons for destructive or business-critical actions unless the action is already obvious and has a tooltip.
- Use icons for scan speed: image, fabric, accessory, factory, PDF, share, reorder, issue.
- Do not mix multiple icon styles in one screen.

## Component inventory for `/ui`

The `/ui` route should become the WAFL v2 design-system showroom.

Minimum samples:

```text
WAFLButton
WAFLCard
WAFLSheet
MaterialCard
AccessoryCard
FactoryCard
StatusBadge
NextActionCard
AssistantPanel
Upload/Image area
Form field variants
Modal
Drawer
Toast
Mobile card stack
PDF-like Sheet preview
```

The showroom must demonstrate desktop, tablet, and mobile-relevant fragments where possible.

## WAFLButton

Button types:

```text
primary
secondary
ghost
danger
link
iconText
```

Button sizes:

```text
sm
md
lg
```

Rules:

- Primary button should be reserved for one main action per section.
- Secondary buttons are for normal actions.
- Danger buttons require confirmation when destructive.
- Card actions should sit near the related card.
- Do not hide important production actions inside a generic menu by default.

Examples:

```text
PDF 만들기
카톡 공유
원단 발주 요청
공장 전달
리오더
입고 처리
```

## WAFLCard

Card types:

```text
sheetCard
infoCard
actionCard
warningCard
summaryCard
imageCard
historyCard
```

Rules:

- A card should have a clear title, status, primary action, and body.
- A card can be incomplete. Incomplete does not automatically mean blocked.
- Card status should be shown by Korean label with internal code only in development/reference docs.
- A card should not become a dense table unless the data is genuinely tabular.

## WAFLSheet

WAFLSheet is the central workspace object.

Required visual areas:

```text
1. Product image/sketch area
2. Product/Style title
3. Sheet status
4. Primary action row
5. Base info card
6. Material cards
7. Accessory cards
8. Factory/process cards
9. PDF/share preview
10. History summary
```

Rules:

- The Sheet should visually connect to the PDF output.
- The Sheet should not look like a generic form.
- The user should understand that the current Sheet can become a PDF/share link.

## MaterialCard

MaterialCard is used for fabric or main material work.

Recommended fields:

```text
원단명
거래처
컬러
단위
소요량
단가
총액
발주 상태
입고 상태
메모
```

Actions:

```text
원단 정보 수정
발주 요청
발주 PDF 보기
입고 확인
이슈 표시
```

Rules:

- Missing unit price should usually be warning/confirmation, not always blocked.
- Missing supplier may block external order sending.
- MaterialCard should support multiple materials per Sheet.

## AccessoryCard

AccessoryCard is used for 부자재.

Recommended fields:

```text
부자재명
거래처
옵션/색상
단위
수량
단가
총액
발주 상태
입고 상태
메모
```

Rules:

- Products may have no accessories. Use `건너뜀(skipped)` rather than forcing an empty error state.
- Accessory cards should be quick to add and duplicate.

## FactoryCard

FactoryCard is used for factory/process instruction.

Recommended fields:

```text
공장명
공정
수량
납기
전달 메모
전달 PDF/link 상태
검수 상태
```

Actions:

```text
공장 지정
공장 전달
공장용 PDF 보기
제작중 표시
검수로 이동
이슈 표시
```

Rules:

- Due date can be optional at initial creation but should warn before factory delivery.
- Factory instruction should be connected to PDF/share, not separate from it.

## StatusBadge

StatusBadge must show Korean label first.

Sheet status labels:

```text
초안(draft)
준비됨(ready)
발주됨(ordered)
제작중(making)
검수중(inspection)
완료(completed)
보류(hold)
취소(cancelled)
```

Card status labels:

```text
비어있음(empty)
작성중(draft)
준비됨(ready)
요청됨(requested)
발주됨(ordered)
입고됨(received)
이슈(issue)
완료(done)
건너뜀(skipped)
```

Rules:

- Korean label must be visible in user-facing UI.
- English code may be visible only in dev/debug/catalog views.
- Status must include accessible text, not only color.

## NextActionCard

NextActionCard is part of Assistant.

It should show:

```text
다음 할 일
왜 필요한지
위험도
관련 카드
실행 버튼
```

Risk levels:

```text
안내(info)
주의(warning)
확인 필요(confirm_required)
차단(blocked)
```

Rules:

- Assistant should explain what is missing.
- Assistant should not block all incomplete states.
- If blocked, it must explain why.

## AssistantPanel

AssistantPanel replaces the old right-side management-panel feeling.

Sections:

```text
다음 할 일
부족한 정보
발주/공유 가능 여부
최근 변경
빠른 액션
```

Rules:

- Assistant is not an admin panel.
- Assistant is not a hidden settings dump.
- Assistant should guide the user to the next production action.
- Mobile Assistant can become a summary card or bottom sheet.

## Upload/Image area

Image/sketch is first-class data.

Types:

```text
대표 이미지
스케치
참고 이미지
첨부파일
```

Rules:

- Representative image is not just an attachment.
- Upload and camera capture should be easy on mobile.
- R2 storage rules and tenant isolation still apply.
- Missing image should usually be warning, not creation-blocking.

## Form field variants

Minimum field types:

```text
text
textarea
number
currency
quantity
date
select
combobox
file/image upload
search-select
```

Rules:

- Number fields should support Korean production usage: 수량, 단가, 총액, 소요량.
- Mobile number inputs should use numeric keyboard where appropriate.
- Required fields must be visually distinguishable but not overbearing.
- Helper text should explain what happens if the field is missing.

## Modal

Modal rules remain strict:

- Background scroll lock.
- Escape key close where safe.
- Focus trap.
- Fixed close affordance on mobile.
- Do not use modal for every edit. Prefer card inline editing or bottom sheet when appropriate.

## Drawer / bottom sheet

Drawer should be used for:

```text
Product Explorer on mobile
search/filter
secondary details
Assistant on tablet/mobile
```

Bottom sheet should be considered for:

```text
card edit
quick action confirmation
share options
mobile Assistant summary
```

Rules:

- Avoid nested drawers.
- Preserve scroll position after close.
- Production-critical actions need clear confirmation.

## Toast

Toast should confirm lightweight events:

```text
저장됨
PDF 생성됨
공유 링크 복사됨
발주 요청됨
이미지 업로드 완료
```

Do not use toast as the only error explanation for critical failures.

## Mobile card stack

Mobile order:

```text
1. 대표 이미지 / 스케치
2. 제품명 / 상태 / 주요 액션
3. Assistant 요약
4. 기본정보
5. 원단
6. 부자재
7. 공장/공정
8. 수량 / 납기 / 비용 요약
9. PDF/share
10. 최근 변경
```

Rules:

- Mobile is not compressed PC.
- Use one-column card flow.
- Place actions inside or near the relevant card.
- PDF/share must be easy to find.

## PDF-like Sheet preview

The preview should show that WAFL Sheet can become a shareable document.

Preview should include:

```text
제품 이미지
제품명
수량
납기
원단 요약
부자재 요약
공장/공정 요약
메모
QR/share/link metadata if applicable
```

Rules:

- Preview is not the final PDF generator implementation.
- It is a design sample for screen-to-PDF continuity.
- PDF/share details are defined in `docs/project/v2/11-pdf-share-spec.md` later.

## Do / Don't

### Do

- Use Korean labels first.
- Keep image/sketch visible and important.
- Use cards to reduce input pressure.
- Put actions near the relevant card.
- Let users create a Sheet before every detail is complete.
- Use Assistant to explain missing information.
- Keep status labels readable.
- Design `/ui` as the implementation showroom.

### Don't

- Do not copy the concept image pixel-for-pixel.
- Do not make the screen feel like ERP.
- Do not make every field mandatory at creation.
- Do not hide production actions in a generic overflow menu.
- Do not treat representative image as a generic attachment.
- Do not use role-name UI branching.
- Do not use English-only status labels in user-facing UI.
- Do not implement workspace redesign before `/ui` samples are reviewed.

## Implementation boundary

This document is design-only for `0.30.0-alpha.5`.

It does not authorize:

- UI route implementation.
- DB migration.
- API changes.
- R2 mutation.
- Production behavior change.
- Package changes.

The next implementation-oriented step after design completion should be a restricted `/ui` showroom patch, not a full workspace rewrite.
