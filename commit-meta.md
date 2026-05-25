Version : 0.16.60
Summary : 작업지시서 repository row mapper 분리
Description : 작업지시서 DB row를 WorkOrder/WorkOrderSummary로 변환하는 mapper와 row 값 정규화 helper를 별도 파일로 분리하고 APP_VERSION을 0.16.60으로 갱신했습니다. DB query, 권한, 역할, workflow 동작 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderRowMappers.ts
삭제 파일 목록 :
- 없음
