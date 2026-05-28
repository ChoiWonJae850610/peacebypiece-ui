# WAFL 반응형 UI 영향 범위 점검 — 0.17.84

## 목적

0.17.84는 기능 변경 없이, 이후 UI 제품화 작업의 기준을 정하기 위한 점검 버전이다.

점검 대상은 다음 세 가지다.

1. PC 화면 수정이 tablet/mobile에 영향을 주는 구조인지
2. 작업지시서와 원단·부자재 화면의 화면별 분리 수준이 어디까지 되어 있는지
3. shadcn/Radix 계열 라이브러리 적용 전 어떤 경계부터 잡아야 하는지

## 현재 결론

### 작업지시서 화면

작업지시서 상세 화면은 device switch 구조가 이미 존재한다.

- `components/workorder/detail/views/WorkOrderDetailViewSwitch.tsx`
- `components/workorder/detail/views/WorkOrderDetailDesktopView.tsx`
- `components/workorder/detail/views/WorkOrderDetailTabletView.tsx`
- `components/workorder/detail/views/WorkOrderDetailMobileView.tsx`
- `components/workorder/layout/useWorkOrderDeviceType.ts`

따라서 큰 레이아웃 단위에서는 PC / tablet / mobile이 분리되어 있다.

다만 일부 섹션은 여전히 공통 presentation/viewModel을 공유한다.

- `buildWorkOrderDetailViewModel`
- `WorkOrderDetailContainer`
- `WorkOrderDetailSharedModals`
- 공통 편집 editor hook
- 공통 modal/overlay 계층

즉, **레이아웃은 분리되어 있으나 데이터 모델·편집 로직·공통 모달은 공유**한다.

#### 영향 판단

- PC 전용 파일만 수정하면 tablet/mobile 영향은 제한적이다.
- 공통 section, viewModel, editor, modal을 수정하면 tablet/mobile에도 영향이 갈 수 있다.
- `OrderInfoSection.tsx`, `MaterialSection.tsx`처럼 desktop에서 주로 쓰는 파일이라도 실제 import 관계를 확인한 뒤 수정해야 한다.
- 앞으로 UI 리팩토링 시 파일명만 보고 판단하지 말고 import 사용처 기준으로 영향 범위를 확인해야 한다.

### 원단·부자재 화면

원단·부자재 발주 화면은 현재 별도의 device switch가 없다.

현재 구조:

- `features/material-orders/MaterialOrderWorkspacePage.tsx`
- `features/material-orders/MaterialOrderDraftEditor.tsx`
- `features/material-orders/MaterialOrderListPanel.tsx`
- `features/material-orders/MaterialOrderDetailPanel.tsx`
- `features/material-orders/MaterialOrderAllocationPanel.tsx`

`MaterialOrderDraftEditor.tsx`는 PC 기준 3분할 grid를 직접 구성한다.

```tsx
gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)"
```

또한 외부 wrapper가 `overflow-x-auto`와 `min-w-[1080px]`에 의존한다.

현재 방식은 좁은 화면에서 화면을 줄이는 것이 아니라, PC 화면을 가로 스크롤로 유지하는 구조다.

#### 영향 판단

- 원단·부자재 화면은 PC/tablet/mobile 분리가 아직 부족하다.
- PC UI를 수정하면 좁은 화면에도 거의 그대로 반영될 가능성이 높다.
- tablet/mobile UX를 만들려면 먼저 `MaterialOrderWorkspaceViewSwitch` 또는 동등한 구조가 필요하다.
- 이후 tablet은 2분할, mobile은 단계형 화면 전환으로 분리해야 한다.

## 현재 UI 공통 래퍼 상태

0.17.81~0.17.83에서 다음 내부 UI 래퍼가 추가되었다.

- `AppButton`
- `AppBadge`
- `AppCard`
- `AppListRow`
- `AppSection`
- `AppSeparator`

0.17.82에서 dependency import 문제를 피하기 위해 현재 래퍼는 dependency-free 방식으로 보정되어 있다.

라이브러리 의존성은 package.json에 들어갔지만, 화면에 직접 적용하지 않고 WAFL 내부 래퍼를 통해 단계적으로 연결하는 전략을 유지한다.

## 라이브러리 적용 원칙

### 유지할 원칙

1. 화면 파일에서 shadcn/Radix를 직접 import하지 않는다.
2. `components/common/ui`의 WAFL 내부 래퍼를 통해서만 사용한다.
3. PC 전용 UI 적용은 desktop view 또는 desktop-only section에서 먼저 검증한다.
4. 공통 viewModel/editor/modal 수정은 device별 회귀 범위를 함께 확인한다.
5. 원단·부자재는 device switch를 먼저 만든 뒤 Sheet/Tabs 적용을 검토한다.

### 우선 적용 후보

- `AppButton` → 추후 Radix Slot / shadcn Button 기반으로 재연결
- `AppBadge` → 상태/유형/정보 tone 통일
- `AppCard` → border/radius/shadow 기준 통일
- `AppSection` → 제목/설명/본문 간격 통일
- `AppSeparator` → 카드 중첩 대신 구분선 중심 구조로 전환
- `AppSheet` → tablet/mobile 보조 패널 전환용, 신규 추가 필요
- `AppTabs` → 작업지시서 상세/첨부·메모/자재 선택 전환용, 신규 추가 필요

## 다음 리팩토링 우선순위

### 1순위: 원단·부자재 화면 device switch 추가

목표:

- PC: 현재 3분할 유지
- tablet: 발주서 목록 + 발주 상세 2분할
- mobile: 발주서 목록 → 발주 상세 → 작업지시서/자재 선택 단계형 구조

권장 파일 구조:

```text
features/material-orders/views/MaterialOrderWorkspaceViewSwitch.tsx
features/material-orders/views/MaterialOrderDesktopView.tsx
features/material-orders/views/MaterialOrderTabletView.tsx
features/material-orders/views/MaterialOrderMobileView.tsx
features/material-orders/layout/useMaterialOrderDeviceType.ts
```

단, `useWorkOrderDeviceType`와 거의 동일한 로직이므로 중복 작성하지 않고 공통 responsive hook으로 빼는 것이 더 낫다.

권장 공통화:

```text
components/responsive/useResponsiveDeviceType.ts
components/responsive/responsiveDeviceTypes.ts
```

### 2순위: 작업지시서 device hook 공통화

현재 작업지시서에만 있는 `useWorkOrderDeviceType`를 앱 공통 hook으로 옮긴다.

주의:

- 기존 작업지시서 동작을 깨지 않게 alias 또는 얇은 wrapper를 유지한다.
- breakpoint는 현재 기준을 일단 유지한다.
  - mobile: max-width 767px
  - tablet: 768px ~ 1279px
  - desktop: 1280px 이상

### 3순위: Sheet/Tabs 도입 준비

모바일/태블릿에서 필요한 전환 구조:

- 작업지시서 우측 첨부/메모 패널 → 탭 또는 Sheet
- 원단·부자재 우측 작업지시서 후보 패널 → Sheet
- 발주서 필터 → Drawer/Popover 후보
- 상세의 긴 섹션 → Tabs/Accordion 후보

### 4순위: PC UI 고도화 재개

device boundary가 잡힌 뒤 PC 화면의 촌스러운 요소를 다시 정리한다.

- 과도한 border 제거
- 카드 안의 카드 축소
- 큰 카드 + 내부 separator 구조 확대
- 목록 row와 상세 section 스타일 분리
- 상태 badge tone 통일

## 권장 다음 버전

### 0.17.85

- 공통 responsive device hook 추가
- 기존 작업지시서 device hook은 공통 hook을 사용하도록 얇게 변경
- 원단·부자재 화면 device switch 1차 생성
- PC 화면은 기존 3분할 유지
- tablet/mobile은 아직 완성형 UI가 아니라 안전한 분기 기반만 만든다

### 0.17.86

- 원단·부자재 tablet view 1차
- PC 3분할과 분리
- 우측 작업지시서 후보는 상세 내부 또는 임시 하단 영역으로 이동

### 0.17.87

- 원단·부자재 mobile view 1차
- 목록 → 상세 → 자재 선택 단계형 구조 적용
- Sheet/Tabs 도입 여부 결정

## 빌드 관련 메모

0.17.84에서는 빌드를 실행하지 않았다.

최근 build fail은 `tailwind-merge` import 문제였고, 0.17.82에서 dependency-free 방식으로 우회 보정되었다. 이후 fail log가 다시 올라오면 다음 작업과 함께 우선 수정한다.
