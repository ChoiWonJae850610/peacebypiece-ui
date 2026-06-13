# 0.21.96 발주서 품목/할당 구조 리팩토링

## 목적
- MaterialOrderDraftEditor와 발주서 내부 섹션의 과밀도를 줄인다.
- 발주 품목 카드, 수정 모달, 발주 대상 할당 카드, 수량 비율 표시를 분리한다.
- 발주서 수량/단가 입력 primitive를 AppNumberInput 기준으로 통일한다.

## 변경
- MaterialOrderLineCard 추가
- MaterialOrderLineEditModal 추가
- MaterialOrderAllocationCard 추가
- MaterialOrderAllocationRow 추가
- 수량 비율 표시 helper를 materialOrderPanelUtils로 이동

## 확인 필요
- 발주 품목 수정 메뉴
- 발주 품목 수정 모달 수량/단가 콤마 표시
- 발주 대상 우측 패널 추가/빼기/대기 버튼
- 부분 할당 수량 비율 색상
