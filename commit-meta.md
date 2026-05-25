Version : 0.16.55
Summary : 작업지시서 repository 조회 import 경계 분리
Description : 작업지시서 DB repository의 list/detail 조회 함수 사용 경로를 dbWorkOrderReadRepository로 분리했습니다. 기존 DB repository 구현은 유지하고, workOrderRepository 및 발주 요청 HTML/PDF 생성 route가 조회 전용 repository 경계를 통해 접근하도록 정리했습니다. APP_VERSION을 0.16.55로 올렸습니다. npm run build는 실행하지 않았습니다.
수정 파일 목록 :
- app/api/workorders/[workOrderId]/generated/order-request-html/route.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/constants/app.ts
- lib/workorder/repository/workOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderReadRepository.ts
삭제 파일 목록 :
- 없음
