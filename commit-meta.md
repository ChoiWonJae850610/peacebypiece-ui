Version : 0.17.15
Summary : 원단·부자재 필요 자재 기반 품목 추가 흐름 정리
Description : 우측 작업지시서 후보에서 자재가 없는 작업지시서를 제외하고, 작업지시서에 입력된 원단·부자재 필요 자재를 한 줄 단위로 표시해 발주 품목으로 바로 추가할 수 있도록 정리했습니다. 가운데 품목 라인은 우측 필요 자재에서 자동 생성되며 품목명, 단위, 수량과 해당 작업지시서 할당이 함께 반영됩니다. 작업지시서 summary 조회에는 자재 상세 JSON 요약을 추가했으며 DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/material-orders/materialOrderDraftCalculator.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
- types/workorder.ts
- lib/workorder/repository/dbWorkOrderRepositoryTypes.ts
- lib/workorder/repository/dbWorkOrderRowMappers.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
