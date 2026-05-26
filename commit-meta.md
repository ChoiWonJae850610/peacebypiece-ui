Version : 0.17.12
Summary : 원단·부자재 저장 오류와 작업지시서 후보 조회 보정
Description : 원단·부자재 발주 상세 저장/상태 변경 시 담당자 scope 조건이 UPDATE 쿼리에서 잘못된 alias를 참조하던 문제를 보정했습니다. 작업지시서 후보 목록은 공급처 선택과 무관하게 발주 요청 이후 자재 배분 대상 작업지시서를 표시하도록 조정하고, 후보 카드에 원단/부자재 개수 요약을 표시하도록 summary 조회 필드를 보강했습니다. API 실패 응답은 실제 오류 메시지를 포함하도록 보정해 이후 테스트 원인 확인이 쉬워지도록 했습니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/material-orders/route.ts
- lib/material-orders/repository.ts
- lib/material-orders/materialOrderWorkspaceClient.ts
- features/material-orders/MaterialOrderAllocationPanel.tsx
- types/workorder.ts
- lib/workorder/repository/dbWorkOrderRepositoryTypes.ts
- lib/workorder/repository/dbWorkOrderRowMappers.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
