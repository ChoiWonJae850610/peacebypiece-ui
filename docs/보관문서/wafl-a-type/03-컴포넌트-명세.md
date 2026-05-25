---
title: WAFL A-TYPE Component Spec
version: 0.4
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-18
---


# 03. 공통 컴포넌트 명세

## 1. 컴포넌트 전략

현재 소스의 `Admin*` 공통 컴포넌트를 버리지 않고 A-TYPE 규칙에 맞게 정리한다.

```txt
1차: Admin* 컴포넌트의 token/variant 정리
2차: 필요 시 Wafl* alias 또는 wrapper 도입
```

## 2. 공통 컴포넌트 목록

```txt
AdminButton / AdminIconButton / AdminCard / AdminTable / AdminFilterBar
AdminEmptyState / AdminStatusBadge / AdminSummaryMetricCards
AdminSegmentedTabs / AdminDateRangePicker / AdminModal
```

추가 후보:

```txt
AdminDrawer / AdminBottomSheet / AdminErrorState / AdminListCard
AdminStepForm / AdminKpiCard / AdminActionMenu
```

## 3. Button

```ts
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
```

수치:

```txt
sm: 36px
md: 40~44px
lg/mobile primary: 48px
```

규칙:

```txt
- Primary는 한 섹션에 1개를 기본으로 한다.
- Danger는 삭제/비우기/취소 요청에만 사용한다.
- loading 상태는 spinner 또는 처리 중 문구를 표시한다.
- disabled 상태는 필요 시 tooltip/helper text를 제공한다.
```

## 4. Card

```ts
type CardVariant = "base" | "soft" | "selected" | "warning" | "danger";
```

구조:

```tsx
<AdminCard>
  <AdminCardHeader />
  <AdminCardBody />
  <AdminCardFooter />
</AdminCard>
```

## 5. Badge / Status

```ts
type Tone = "neutral" | "brand" | "success" | "info" | "warning" | "danger";
```

상태는 meta에서 관리한다.

```ts
export const INVITE_STATUS_META = {
  pending: { labelKey: "invite.status.pending", tone: "warning" },
  sent: { labelKey: "invite.status.sent", tone: "success" },
  expired: { labelKey: "invite.status.expired", tone: "danger" },
  cancelled: { labelKey: "invite.status.cancelled", tone: "neutral" },
} as const;
```

## 6. Table / List Card

```txt
PC: Table
Tablet Landscape: Compact Table 가능
Tablet Portrait: Card List
Mobile: Card List
```

ListCard 구조:

```txt
title / subtitle / meta / chips-badges / action
```

## 7. Modal / Drawer / BottomSheet

```txt
PC: Modal
Tablet Landscape: Modal 또는 Drawer
Tablet Portrait: Fullscreen Sheet
Mobile: BottomSheet 또는 Fullscreen Sheet
```

## 8. 금지 규칙

```txt
- 도메인 API 호출을 primitive 컴포넌트에 넣지 않는다.
- 상태 label을 UI 컴포넌트에 직접 하드코딩하지 않는다.
- 색상 class를 화면마다 직접 조합하지 않는다.
- 모달마다 focus trap을 개별 구현하지 않는다.
```
