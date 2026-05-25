Version : 0.16.70
Summary : 작업지시서 repository detail rows hydration 분리
Description : 0.16.69 기준으로 작업지시서 repository의 orders/materials/outsourcing 상세 row 조회 및 hydration 로직을 dbWorkOrderDetailRows.ts로 분리했습니다. DB query, 권한, workflow, 버튼 표시 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderDetailRows.ts
삭제 파일 목록 :
- 없음
