Version : 0.16.96
Summary : 원단·부자재 발주 작성 UI 단순화
Description : 원단·부자재 발주 작성 화면에서 발주 종류를 먼저 선택하고 해당 종류의 공급처를 선택하는 구조로 정리했습니다. 품목 라인은 품목명, 단위, 주문수량, 단가만 입력하도록 단순화하고 색상, 규격, 예정 배분수량, 품목별 구분 입력을 제거했습니다. 배분 수량과 재고 예정 계산은 다음 작업지시서 배분 단계로 분리했습니다. DB schema, API, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/material-orders/materialOrderDraftCalculator.ts
- lib/material-orders/materialOrderWorkspaceViewModel.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
