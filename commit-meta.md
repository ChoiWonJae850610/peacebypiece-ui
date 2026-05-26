Version : 0.17.11
Summary : 원단·부자재 발주서 표시명과 작업지시서 후보 정보 정리
Description : 원단·부자재 발주서 목록과 상세 화면에서 내부 발주번호 노출을 제거하고 발주 종류, 공급처, 대표 품목 기반 자동 표시명으로 정리했습니다. 발주서 목록에는 생성일, 상태, 금액, 담당자 정보를 보조 정보로 표시하고 담당자 조회를 위해 material order repository에 요청자 표시명을 추가했습니다. 우측 작업지시서 연결 패널은 발주요청 상태 작업지시서의 제품명, 리오더, 담당자, 원단·부자재 정보 요약이 보이도록 정리했습니다. DB schema와 package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderListPanel.tsx
- features/material-orders/MaterialOrderDetailPanel.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- lib/material-orders/materialOrderWorkspaceClient.ts
- lib/material-orders/repository.ts
- lib/material-orders/types.ts
- types/workorder.ts
- lib/workorder/repository/dbWorkOrderRepositoryTypes.ts
- lib/workorder/repository/dbWorkOrderRowMappers.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
