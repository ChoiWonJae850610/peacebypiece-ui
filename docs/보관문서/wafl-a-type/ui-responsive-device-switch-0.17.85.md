# 0.17.85 반응형 device switch 1차

## 목적

작업지시서 화면에만 흩어져 있던 화면 폭 판정 로직을 공통 hook으로 분리하고, 원단·부자재 발주 화면에도 PC/tablet/mobile 분기 기반을 만든다.

## 반영 기준

- 데이터 로직과 저장 로직은 기존 `useMaterialOrderDraftEditor`를 유지한다.
- PC 화면은 기존 3분할 레이아웃을 그대로 유지한다.
- tablet/mobile은 기능을 새로 만들지 않고, 같은 패널을 화면 폭에 맞게 재배치하는 1차 구조만 둔다.
- Sheet/Tabs 기반 전환은 다음 단계에서 진행한다.

## 구조

### 공통

- `lib/responsive/useResponsiveDeviceType.ts`
  - `mobile`: 767px 이하
  - `tablet`: 768px 이상 1279px 이하
  - `desktop`: 1280px 이상

### 작업지시서

- `components/workorder/layout/useWorkOrderDeviceType.ts`는 공통 hook을 감싸는 얇은 wrapper로 변경한다.
- 기존 작업지시서의 desktop/tablet/mobile view switch는 유지한다.

### 원단·부자재

- `MaterialOrderDraftEditor`에서 공통 hook을 사용한다.
- desktop: 기존 3분할 유지
- tablet: 좌측 목록 + 우측 상세/후보 세로 배치
- mobile: 목록 → 상세 → 후보 패널을 세로 스택으로 표시

## 다음 단계

0.17.86 이후에는 tablet/mobile에서 보조 패널을 Sheet 또는 Tabs 구조로 이동할지 확인한다.
