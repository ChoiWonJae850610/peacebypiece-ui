# WAFL v2 App Feature Map from /ui alpha.27 - 2.0.0-alpha.1

## Purpose

This document maps the existing `/ui` alpha.27 design baseline into the App-first production-card section model.

`/ui` remains the implementation-baseline design showroom. The customer-facing direction is Expo React Native.

## Section map

### 1. 개요

Carries the production-card summary:

- product identity,
- representative image,
- quantity,
- due date,
- unit estimate,
- total estimate,
- production state,
- current blocker and next action.

### 2. 이미지·첨부

Maps from alpha.27 image compression:

- user-facing label is `이미지 목록`,
- thumbnail-first image list,
- crown representative selector,
- delete icon,
- preview by thumbnail/item click,
- attachment rows are compact and separate from image selection.

Attachments are not representative images.

### 3. 사이즈·색상

Carries:

- size system,
- size chips,
- measurement table,
- cm/inch toggle,
- inch fraction helper,
- color quantity rows.

Inch fractions preserve the existing planning direction:

```text
1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8
```

### 4. 원단

Carries:

- material rows,
- required quantity,
- loss/allowance,
- stock use,
- order quantity,
- unit price and amount,
- compact status and order actions.

### 5. 부자재

Carries:

- accessory rows,
- category/option,
- required quantity,
- loss/allowance,
- stock use,
- order quantity,
- unit price and amount,
- compact status and order actions.

### 6. 제작 플로우

Carries:

- 제작 공장,
- additional process rows,
- process, partner, quantity, unit, unit price, amount, due date, memo,
- reorder/drag or long-press direction.

### 7. 출력·공유

Carries:

- 작업지시서,
- 공장 전달 작업지시서,
- 배송요청 만들기,
- 배송요청 추가하기,
- representative-image thumbnail,
- selected attachment chips,
- attachment picker mock,
- compact delivery-request rows.

Document rows should not repeat `PDF` in every title. The business document names come first.

## Preserved alpha.27 wording

Keep these user-facing concepts:

- 제작 카드
- 제작 문서
- 작업지시서
- 공장 전달 작업지시서
- 배송요청서 만들기
- 배송요청 추가하기

Do not repeat `PDF` in document names unless the user is clearly choosing a file format or viewing a generated file.

## Boundary

This map does not implement any Expo screen, API, DB, R2, Worker, file preview, image editing, delivery request, or PDF generation behavior.

## 2.0.0-alpha.6 mobile alignment correction

`2.0.0-alpha.6` applies this map back into `apps/mobile` as a mock-only alignment pass.

Core correction:

- The app mock should read as a WAFL production-card flow, not a generic production-management or project-management screen.
- The visible work order is `대표 이미지/기본 정보 확인 -> 이미지·첨부 정리 -> 사이즈·색상 수량 확인 -> 원단 입력·발주 -> 부자재 입력·발주 -> 제작 공장 + 추가 공정 정리 -> 제작 문서/공장 전달 작업지시서/배송요청 출력·공유`.
- Each section may show a compact `다음 확인` or `작업 사인` panel instead of a developer-like assistant panel.
- The production-flow section represents `제작 공장`, `추가 공정`, and `공장 전달 준비`. It should not look like a full production progress tracker.
- Avoid generic process statuses such as `진행 예정`, `일정 확인`, or `대기` in the default production-card mock. Prefer `공장 전달 준비`, `작업지시서 전달 준비`, `공정 메모 필요`, `단가 확인 필요`, `납기 확인 필요`, `전달 전 확인`, or `전달 완료`.
- Output/share should show document types and included information before actions. Document names should remain business names first, not repeated PDF titles.
- Delivery-request rows should imply one origin, one destination, multiple items, contact confirmation, and delivery memo.
- User-facing text should use `사이즈·색상`, while internal code names may remain `size` and `color`.
- Image/attachment detail deepening is deferred to `2.0.0-alpha.7`.

Implementation boundary:

```text
No real upload, camera, file picker, share, PDF generation, delivery request, order mutation, API, DB, R2, Worker, drag, or long-press behavior is authorized by this alignment correction.
```
