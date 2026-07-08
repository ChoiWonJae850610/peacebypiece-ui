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

### 3. 사이즈·컬러

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
