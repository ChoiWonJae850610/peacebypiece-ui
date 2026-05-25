---
title: WAFL A-TYPE Admin Component Variant Implementation
version: 0.1
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-20
---

# 24. Admin 공통 컴포넌트 variant 구현 기준

## 1. 목적

0.15.3부터 기존 `Admin*` 공통 컴포넌트를 버리지 않고 WAFL A-TYPE 기준으로 승격한다.

이 문서는 실제 코드에서 사용할 variant/tone/surface 기준과 이후 화면 적용 순서를 정의한다.

## 2. 적용 대상

```txt
components/admin/common/AdminButton.tsx
components/admin/common/AdminStatusBadge.tsx
components/admin/common/AdminEmptyState.tsx
components/admin/common/AdminFilterBar.tsx
components/admin/common/AdminTable.tsx
components/admin/layout/AdminCard.tsx
components/admin/layout/AdminModal.tsx
```

## 3. 공통 variant helper

공통 tone/surface 조합은 아래 파일에서 관리한다.

```txt
components/admin/common/adminComponentVariants.ts
```

기준 타입:

```ts
type AdminTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "inverse";
type AdminSurfaceVariant = "base" | "soft" | "selected" | "warning" | "danger";
```

## 4. Button

기존 variant는 유지한다.

```ts
type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type AdminButtonSize = "sm" | "md" | "lg";
```

정책:

```txt
- primary는 한 섹션에 1개를 기본으로 한다.
- danger는 삭제/비우기/취소 요청에만 사용한다.
- lg는 모바일/터치 환경의 primary action 준비용이다.
- 버튼 색상은 pbp-action-* token class를 통해 적용한다.
```

## 5. Badge / Status

A-TYPE tone 기준:

```txt
neutral
brand
info
success
warning
danger
inverse
```

호환 기준:

```txt
primary → brand로 매핑
maintenance → info로 매핑
```

주의:

```txt
- 새 화면에서는 primary/maintenance 대신 brand/info를 우선 사용한다.
- 상태 label은 화면에 직접 하드코딩하지 않고 meta 또는 i18n key에서 가져온다.
```

## 6. Empty State

A-TYPE empty state 기본 구조:

```txt
Icon / Title / Description / PrimaryAction?
```

현재 0.15.3에서는 기존 API를 유지하면서 surface/tone만 token 기준으로 정리했다.

지원 tone:

```txt
neutral
warning
danger
```

## 7. Card

`AdminCard`는 기존 `pbp-admin-card`를 유지하되 선택적으로 surface variant를 받을 수 있다.

```ts
variant?: "base" | "soft" | "selected" | "warning" | "danger";
```

정책:

```txt
- 기본 화면 카드는 base를 사용한다.
- 선택된 항목은 selected를 사용한다.
- 안내/주의/위험 카드는 warning/danger를 사용한다.
- 화면마다 raw color class를 직접 조합하지 않는다.
```

## 8. Table / FilterBar

0.15.3에서는 className 병합과 token class 유지 기준만 정리한다.

다음 단계에서 적용할 기준:

```txt
PC: AdminTable
tablet-landscape: compact table 가능
tablet-portrait/mobile: card list 전환
```

## 9. 금지 규칙

```txt
- Admin 공통 컴포넌트 안에 domain API 호출을 넣지 않는다.
- 상태 label을 컴포넌트에 직접 하드코딩하지 않는다.
- raw hex / bg-[#...]를 추가하지 않는다.
- status color와 brand color를 섞지 않는다.
- 모바일 전용 UX를 PC component 안에 억지로 넣지 않는다.
```

## 10. 다음 적용 순서

```txt
0.15.4 Login / Invite / Error A-TYPE
0.15.5 고객사 관리자 주요 화면 A-TYPE
0.15.6 시스템관리자 주요 화면 A-TYPE
0.16.x DeviceKind / tablet / mobile
```
