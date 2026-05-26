Version : 0.17.9
Summary : 원단·부자재 작업지시서 배분 입력 연결
Description : 원단·부자재 발주 화면의 오른쪽 작업지시서 연결/배분 패널에서 실제 작업지시서를 선택한 품목 라인에 연결하고 배분 수량과 메모를 입력할 수 있도록 로컬 편집 흐름을 추가했습니다. 가운데 품목 라인에는 배분/잔여 수량 요약을 표시하고, 저장 시 기존 발주 상세 저장 API의 allocations payload로 함께 저장되도록 연결했습니다. DB schema, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/material-orders/materialOrderDraftCalculator.ts
- lib/material-orders/materialOrderDraftWorkspace.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
