Version : 0.16.77
Summary : 작업지시서 repository save flow 분리
Description : dbWorkOrderRepository.ts의 saveDbWorkOrder/saveDbWorkOrders 본문을 dbWorkOrderSaveFlows.ts로 분리하고, 기존 create/update 흐름을 주입받는 방식으로 저장 fallback 동작을 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderSaveFlows.ts
삭제 파일 목록 :
- 없음
