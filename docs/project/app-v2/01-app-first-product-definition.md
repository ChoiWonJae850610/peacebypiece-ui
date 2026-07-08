# WAFL v2 App-first Product Definition - 2.0.0-alpha.1

## Definition

WAFL v2 is a mobile/tablet-first production workspace that organizes the clothing production process around product, style, image, attachment, size/color, material, accessory, production flow, output, and sharing inside one production card.

Korean product phrase:

```text
WAFL v2는 동대문 의류 제작 과정을 제품/스타일 단위로 정리하고, 대표 이미지, 이미지·첨부, 사이즈·컬러, 원단, 부자재, 제작 플로우, 출력·공유를 하나의 제작 카드 안에서 관리하는 모바일·태블릿 우선 의류 제작 워크스페이스다.
```

## Product stance

The customer product should feel like something used directly on a device in the field.

The priority target is Expo React Native.

PC web is not the primary customer product UI.

All real customer product roles enter through the app direction:

- 시스템관리자
- 고객사 관리자
- 디자이너
- 재고관리

Designated Google or Apple accounts may be mapped to 시스템관리자 in later auth work, but this alpha.2 skeleton does not implement real login.

Next.js remains important for the public landing site, API/server integration, file/PDF/R2/Worker boundaries, internal localhost development checks, and remaining legacy/admin surfaces during transition.

`/system` and `/workspace` are long-term product removal targets. They must be deprecated in phases only after the app replaces their duties.

`/ui`, `/roadmap`, and `/functions` are not customer product screens in the App-first line. They are localhost-only development check routes.

## Login direction

Customer login planning should prioritize:

- Google account.
- Apple ID.

Email/password-only app identity is not the preferred App-first direction unless a later work order explicitly changes the auth policy.

## What this version does not decide

This document does not create or implement:

- native auth configuration.
- Apple Developer Program setup.
- Google Play Console setup.
- production OAuth credentials.
- DB schema changes.
- API changes.

The first Expo skeleton is created in `apps/mobile` by `2.0.0-alpha.2`, but it is mock-only and does not connect to real auth, camera, files, sharing, DB, API, R2, Worker, or PDF generation.

Those decisions belong to later implementation phases.

## Preserved product objects

The App-first line still preserves the WAFL v2 object center:

```text
Product / Style
-> Production Card / WAFL Sheet
-> Section/Card work areas
```

For user-facing app copy, use natural Korean such as:

- 제작 카드
- 제작 요약
- 이미지 목록
- 사이즈·컬러
- 제작 플로우
- 출력·공유
- 작업지시서
- 공장 전달 작업지시서
- 배송요청 만들기

Internal documents and implementation may still use Product, Sheet, Card, and action-code terminology where that improves precision.
