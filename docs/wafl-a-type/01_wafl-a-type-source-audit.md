---
title: WAFL A-TYPE Source Audit
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 01. 소스 분석 요약

## 1. 분석 기준

```txt
기준 소스: peacebypiece-ui-0.13.50
목적: 현재 구현 상태를 기준으로 A-TYPE 전환 범위 판단
빌드: 실행하지 않음
```

## 2. 현재 구현 강점

```txt
- Next.js App Router 기반 route 구조
- app/admin, app/system, app/workspace, app/worker, app/invite, app/login 구분
- AdminShell, AdminTopbar, AdminSidebar, AdminCard, AdminModal
- AdminButton, AdminTable, AdminFilterBar, AdminEmptyState, AdminStatusBadge
- theme provider와 CSS variable 기반 semantic token
- beige-atelier 테마
- i18n ko/en resource 구조
- 작업지시서 desktop/tablet/mobile view 분리
- invitation, membership, permission, storage, stats, partner, workorder domain layer
```

## 3. 현재 보완 대상

```txt
- raw Tailwind color class / arbitrary hex class 잔여
- 로그인/초대/에러 화면의 token화 부족
- AdminStatusBadge, AdminEmptyState 등 상태형 컴포넌트의 tone 체계 정리 필요
- tablet orientation 분리 없음
- 관리자 화면 device policy 미정
- 모바일 하단 탭/시트/단계형 폼 기준 부족
- hardcoded Korean text 잔여
- pbp prefix와 WAFL 브랜드명 관계 문서화 필요
```

## 4. 유지해야 할 것

A-TYPE 전환 중 아래 흐름은 직접 수정하지 않는다.

```txt
- DB schema
- API route 동작
- companyId scope
- auth/session guard
- R2 upload/delete/purge
- 작업지시서 attachment/memo 흐름
- storage/trash restore/delete request flow
- stats repository 계산
- member invitation token flow
- permission guard
```

## 5. 전환 방식

```txt
기존 domain/API/repository 유지
기존 Admin* 공통 컴포넌트 유지
theme token과 component variant 정리
PC 화면부터 시각/구조 통일
특수 화면 로그인/초대/에러 정리
이후 태블릿/모바일 전용 구조 확장
```
