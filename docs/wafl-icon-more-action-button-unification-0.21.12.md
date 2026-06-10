# WAFL Icon/More Action Button 통합 1차 (0.21.12)

## 목적

작업지시서 목록 카드의 `...` 버튼과 제작 공정/자재 카드에서 쓰는 `...` 버튼이 서로 다른 구현과 모양을 갖는 문제를 줄이기 위해 icon/more action 기준 컴포넌트를 공통화한다.

## 변경 기준

- `WaflActionButton`은 기존 action button primitive로 유지한다.
- `WaflIconButton`은 icon action의 명시적 primitive로 추가한다.
- `WaflMoreActionButton`은 `...` 액션 전용 primitive로 추가한다.
- 작업지시서 목록 카드의 `...` 버튼은 `WorkOrderMoreIconButton`을 사용하도록 전환한다.
- `WorkOrderMoreIconButton`은 내부적으로 `WaflMoreActionButton`을 사용한다.

## 적용 범위

- `components/common/ui/WaflActionButton.tsx`
- `components/workorder/common/WorkOrderIconButtons.tsx`
- `components/workorder/list/WorkOrderListCard.tsx`
- `/ui` 컴포넌트 재고표 설명

## 유지한 것

- 메뉴 열림/닫힘 로직은 변경하지 않는다.
- 수정/삭제/재정렬 동작은 변경하지 않는다.
- 실제 도메인 데이터 흐름은 변경하지 않는다.

## 다음 전환 대상

- 우측 패널의 `+` 버튼
- 메모 수정/삭제 icon button
- 저장소 row action button
- 발주 row action button
- AdminIconActionButton 계열
