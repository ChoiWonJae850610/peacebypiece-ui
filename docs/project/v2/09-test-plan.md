# WAFL v2 Test Plan - Mobile Web Baseline - 0.30.0-alpha.8

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

## Seed/test scenarios still pending

The following are not completed in this baseline and should be designed next:

```text
- test companies
- test users for 시스템관리자 / 고객사 관리자 / 디자이너 / 재고관리
- test Products/Styles
- sample Sheets with complete, incomplete, issue, hold, reorder, PDF states
- R2 storage usage levels by company/plan
- PDF temporary/final/share-link sample metadata
- inventory receiving/inspection sample data
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
