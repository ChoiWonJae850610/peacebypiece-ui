# 0.21.95 작업지시서 섹션 카드 primitive 정리

## 목적

작업지시서 화면의 제작공정, 추가공정, 원단, 부자재 카드가 각각 별도 surface/action menu 구조를 직접 구현하고 있어 WAFL primitive 기준으로 중복을 줄였다.

## 변경

- `WorkOrderSectionListPrimitives` 추가
- `WorkOrderSectionListCard` 추가
- `formatWorkOrderQuantity` 추가
- `formatWorkOrderMoney` 추가
- `OrderInfoSection`의 공정 카드 렌더링을 공통 카드로 교체
- `MaterialSection`의 자재 카드 렌더링을 공통 카드로 교체

## 유지

- 공정/자재 추가 버튼 동작 유지
- 수정/삭제 action menu 동작 유지
- 기존 모달 호출 흐름 유지
- 기존 EmptyCard 표시 유지

## QA

사용자 요청에 따라 0.21.93부터 리팩토링 버전은 누적 적용 후 일괄 테스트 예정이므로 이번 패치에서는 build와 화면 QA를 실행하지 않았다.
