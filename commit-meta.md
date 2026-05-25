Version : 0.16.76
Summary : 작업지시서 repository create update mutation flow 분리
Description : dbWorkOrderRepository.ts의 createDbWorkOrder/updateDbWorkOrder 본문을 축소하고, 정규화·카테고리 ID 해석·INSERT/UPDATE 실행·생산구성 동기화 흐름을 dbWorkOrderMutationFlows.ts로 분리했습니다. DB schema, 권한, workflow 정책, 버튼 표시 조건은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderMutationFlows.ts
삭제 파일 목록 :
- 없음
