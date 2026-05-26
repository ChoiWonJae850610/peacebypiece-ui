Version : 0.16.95
Summary : 원단·부자재 발주 작성 화면 1차 추가
Description : 원단·부자재 발주 업무 화면에 로컬 draft 기반 발주 작성/상세 1차 UI를 추가했습니다. 공급처, 전달/보관 메모, 내부 메모, 품목 라인, 주문수량, 예정 배분수량, 단가, 금액 합계, 재고 예정 수량을 입력/확인할 수 있도록 구성했습니다. 계산 로직은 materialOrderDraftCalculator로 분리했고, API 저장/작업지시서 연결/DB schema/package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderWorkspacePage.tsx
- lib/material-orders/materialOrderWorkspaceViewModel.ts
추가 파일 목록 :
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/material-orders/materialOrderDraftCalculator.ts
삭제 파일 목록 :
- 없음
