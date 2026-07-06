# WAFL v2 Test Plan - Mobile Web and Seed Baseline - 0.30.0-alpha.9

## Purpose

This document defines the first WAFL v2 test-plan baseline.

It is intentionally focused on mobile-web and interaction stability because WAFL v2 will be used as a web app on iPhone, Android, tablet, and PC. A design that looks acceptable on desktop but fails on mobile input, Korean typing, modal scroll, or device rotation is not acceptable.

This document is a planning/test standard only. It does not implement tests or seed data.

## Test principle

WAFL v2 testing must verify both business flow and device behavior.

```text
좋은 화면 = 예쁜 화면 + 실제 입력이 깨지지 않는 화면
좋은 모바일 UX = 확대되지 않고, 포커스가 튀지 않고, 키보드와 회전에 견디는 화면
```

## Required device matrix

Minimum manual QA matrix before major workspace implementation acceptance:

```text
PC Chrome
- standard desktop width
- narrow desktop width

iPhone Safari
- portrait
- landscape
- Korean text input
- numeric input
- modal/drawer/bottom sheet

iPhone Chrome
- portrait
- input focus zoom check
- PDF/share flow check

Android Chrome
- portrait
- numeric keyboard
- modal/drawer scroll lock

iPad or tablet browser
- portrait
- landscape
- Sheet card editing
- PDF preview readability
```

## Mobile input QA

### iPhone input zoom

Check:

```text
1. Open a WAFL Sheet or `/ui` form-field sample on iPhone Safari.
2. Tap text input.
3. Tap textarea.
4. Tap select-like control if implemented.
5. Confirm the page does not unexpectedly zoom.
6. Repeat on iPhone Chrome.
```

Pass criteria:

```text
- Input focus does not zoom the entire page.
- Field text remains readable.
- User can continue editing without manually zooming out.
```

Design requirement:

```text
- Mobile input/textarea/select actual font-size is at least 16px.
```

### Korean IME focus stability

Check:

```text
1. Type Korean product names continuously.
2. Type Korean memo text continuously.
3. Type Korean supplier/factory notes continuously.
4. Type while autosave/debounce/validation is active, if implemented.
5. Confirm the active input does not lose focus after each character.
6. Confirm Korean composition is not prematurely committed or broken.
```

Example test strings:

```text
셔링 원피스
플리츠 스커트
원단 단가 확인 필요
공장 전달 전 납기 재확인
```

Pass criteria:

```text
- Focus remains in the field while typing.
- Characters are not dropped.
- Text is not reset.
- Validation or Assistant updates do not remount the active field.
```

### Numeric input QA

Check:

```text
- 수량
- 단가
- 소요량
- 불량 수량
- 입고 수량
```

Pass criteria:

```text
- Mobile numeric keypad is requested where appropriate.
- User can clear and re-enter values.
- 0 restoration, formatting, or validation does not fight active typing.
- Formatting can happen on blur when live formatting would be disruptive.
```

## Modal / drawer / bottom sheet QA

Check each modal/drawer/bottom sheet pattern:

```text
- Open
- Close button
- ESC close on PC where allowed
- Outside click behavior where allowed
- Focus trap on PC
- Body scroll lock
- Internal scroll
- Scroll position restoration after close
- Keyboard open while modal has input
- Device rotation while open
```

Pass criteria:

```text
- Background page does not scroll while blocking modal/drawer is open.
- Backdrop blur/dimming is consistent.
- Close action remains reachable.
- Scroll lock is released after close.
- The page does not jump to top after close unless intentionally navigated.
- Rotation does not leave the UI stuck.
```

## Orientation QA

Check:

```text
1. Open mobile WAFL Sheet in portrait.
2. Scroll to material/accessory/factory card.
3. Rotate to landscape.
4. Rotate back to portrait.
5. Repeat with a modal open.
6. Repeat with bottom action area visible.
7. Repeat with PDF-like preview visible.
```

Pass criteria:

```text
- Sheet card stack remains usable.
- No critical action is hidden behind safe area.
- PDF preview remains readable.
- Open modal/drawer remains closable or safely closes.
- Scroll lock does not get stuck.
```

## PDF/share QA

Check:

```text
- PDF 미리보기
- 검토용 PDF 생성
- 최종 PDF 보관
- 공유 링크 만들기
- 공유 중지
- 만료/폐기 상태 표시
```

Pass criteria:

```text
- User-facing wording does not expose raw R2/Worker terms.
- Shared/final PDF snapshot is not silently overwritten.
- Temporary preview PDF is visually distinguished from final/shared PDF.
- Cost visibility follows permission rules.
```

## Image/upload QA

Check:

```text
- 대표 이미지 올리기
- 스케치 올리기
- 첨부 추가
- 모바일 카메라/사진 선택
- 삭제 요청
- 복구/영구삭제 flow when implemented
```

Pass criteria:

```text
- Image/sketch is treated as first-class Sheet data.
- User-facing UI does not expose raw R2 object operations.
- Upload/delete behavior goes through controlled app API or Worker flow when implemented.
- Mobile upload controls are easy to tap.
```

## `/ui` showroom QA before workspace implementation

Before Codex rewrites the real workspace, `/ui` should demonstrate and be manually checked for:

```text
- WAFLButton mobile touch targets
- WAFLCard spacing
- WAFLSheet desktop/tablet/mobile variants
- MaterialCard / AccessoryCard / FactoryCard
- StatusBadge Korean labels
- AssistantPanel / NextActionCard
- Upload/Image area
- Form field variants with 16px mobile input text
- Korean text input stability sample
- Modal with unified backdrop and focus behavior
- Drawer / bottom sheet with scroll lock
- Toast
- Mobile card stack
- PDF-like Sheet preview
```

## 0.30.0-alpha.9 seed data and QA scenario baseline

This section converts the prior seed/test pending list into a first detailed planning baseline.

It does not implement seed commands, database mutations, R2 mutations, Worker deployment, or Playwright tests.

### Seed company matrix

```text
PB-V2-001 Normal Active Company
- active customer company
- standard storage usage
- has customer admin, designer, inventory manager
- has complete and incomplete Sheets

PB-V2-002 Low Data Trial Company
- small customer company
- minimal data
- tests empty states and first-run UX
- low R2 usage

PB-V2-003 High Storage Company
- active customer company
- many images/PDFs/attachments
- tests storage warning UI
- R2 usage around warning/near-limit ranges

PB-V2-004 Paused Company
- service-paused or billing-limited state
- tests guarded access and system-admin support flow

PB-V2-005 Onboarding/Policy Edge Company
- optional scenario
- incomplete policy/onboarding state for system-admin QA
```

### Seed user/role matrix

```text
시스템관리자(system_admin)
- service operator
- sees system/customer/storage/audit views
- not a normal customer workspace actor

고객사 관리자(customer_admin)
- customer-side admin
- can manage company settings, members, Sheets, PDF/share, cost visibility, partner data

디자이너(designer)
- creates Product/Style and WAFL Sheet
- uploads image/sketch
- edits fabric/accessory/factory cards
- requests or performs allowed PDF/share actions according to permissions

재고관리(inventory_manager)
- handles inbound, inspection, defect quantity, stock reflection
- does not manage company settings or member permissions
```

### Seed Product/Sheet scenario matrix

```text
S-001 Minimal Draft
- product name and quantity only
- no image
- Sheet status: 초안(draft)
- Assistant shows missing information

S-002 Image First Ready Sheet
- representative image and sketch attached
- basic information complete
- Sheet status: 준비됨(ready)

S-003 Fabric Warning Sheet
- fabric card exists
- supplier/quantity exists
- unit price missing
- Assistant severity: warning or confirm_required

S-004 Accessory Skipped Sheet
- no accessory needed
- accessory card status: 건너뜀(skipped)

S-005 Factory Assigned Sheet
- factory/process card assigned
- delivery date exists
- factory PDF can be prepared

S-006 Ordered Shared PDF Sheet
- 발주됨(ordered)
- shared_snapshot PDF exists
- share link active

S-007 Making Sheet
- 제작중(making)
- factory/process in progress
- pending inbound

S-008 Inspection Issue Sheet
- 검수중(inspection)
- partial inbound
- defect quantity exists
- issue card state visible

S-009 Completed Sheet
- 완료(completed)
- stock reflection event exists
- final PDF snapshot exists

S-010 Reorder Sheet
- copied/reordered from previous Product/Style
- links to prior Sheet
- reorder speed scenario

S-011 Hold Sheet
- 보류(hold)
- material shortage or factory delay
- Assistant explains blocker/recommendation
```

### PDF/R2/Worker scenario matrix

```text
P-001 Temporary Preview PDF
- 임시 PDF(temporary_preview)
- internal preview only
- cleanup candidate

P-002 Review PDF
- 검토용 PDF(review)
- internal review
- not externally shared by default

P-003 Shared Snapshot PDF
- 공유용 PDF(shared_snapshot)
- active share link
- event/audit record required

P-004 Final PDF
- 최종 PDF(final_snapshot)
- official retained copy
- regeneration creates a new snapshot, not silent overwrite

P-005 Revoked/Expired Link
- share link no longer grants access
- R2 object lifecycle follows storage policy

P-006 Representative Image / Sketch
- stored as core Product/Sheet data
- not treated as a generic attachment only

P-007 Attachment
- supplemental file
- permission and lifecycle differ from representative image/sketch
```

### Inventory scenario matrix

```text
I-001 Expected Inbound
- ordered material or product expected
- no actual inbound yet

I-002 Partial Inbound
- inbound quantity less than expected quantity

I-003 Defect Inspection
- defect quantity entered
- issue event created

I-004 Stock Reflected
- final accepted quantity reflected
- inventory movement event created

I-005 Correction
- dev/test-only correction scenario
- audit event required
```

### Mobile scenario mapping

Each major seed Product/Sheet should be usable in mobile QA:

```text
- edit Korean product name without focus loss
- edit numeric quantity without keyboard/layout failure
- open modal/drawer/bottom sheet
- rotate portrait -> landscape -> portrait
- preview PDF-like Sheet
- upload or simulate image/sketch
- share-link action remains reachable
```

### Required future automation entries

When implementation begins, expose these through the existing PowerShell/dev-test workflow as explicit, environment-guarded actions:

```text
V2 Seed Plan Validate
- safe
- dry-run
- validates seed manifest and required scenarios

V2 Seed Apply
- dev/test-only
- creates seed data
- confirmation required

V2 Seed Reset
- destructive
- dev/test-only
- explicit confirmation required

V2 R2 Usage Scenario Seed
- dev/test-only
- may create demo files or mock storage records
- must never target production R2

V2 Mobile QA Checklist
- safe
- report/export only
```

### Completion criteria for seed/test planning

Seed/test planning is considered sufficient for first Codex implementation when:

```text
- the four Korean roles are covered
- at least five Sheet states are represented
- at least four Card states are represented
- temporary/review/shared/final PDF states are represented
- R2 usage scenarios cover low/normal/warning/near-limit
- mobile input/modal/orientation scenarios are represented
- reset/cleanup strategy is documented before any destructive command exists
```

## Seed implementation boundary

This baseline is planning only. It does not authorize:

```text
- seed mutation
- DB migration
- R2 object creation/deletion
- Worker deployment
- Playwright implementation
- API route changes
- UI route implementation
- production behavior change
- package changes
```

## Implementation boundary

This document is test-planning only for `0.30.0-alpha.8`.

It does not authorize:

```text
- Playwright implementation
- seed mutation
- DB migration
- API route changes
- UI route implementation
- R2 mutation
- Worker deployment
- production behavior change
- package changes
```
