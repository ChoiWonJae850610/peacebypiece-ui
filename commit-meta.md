Version : 0.17.14
Summary : 원단·부자재 화면 WAFL 규격 정리
Description : 원단·부자재 발주 화면의 진행 단계, 품목 라인, 작업지시서 할당 후보 표시를 작업지시서 화면과 같은 WAFL 규격에 맞춰 정리했습니다. 발주 상세 하단 저장/검토요청 버튼을 제거하고 진행 단계 영역에서 상태 액션을 처리하도록 변경했으며, 배분 용어를 할당으로 정리했습니다. 작업지시서 후보의 자재 개수는 원단 n종·부자재 n종으로 표시하고, 자재 요약에는 수량과 단위를 함께 표시하도록 보강했습니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/material-orders/materialOrderWorkspaceClient.ts
- lib/material-orders/materialOrderWorkspaceViewModel.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
