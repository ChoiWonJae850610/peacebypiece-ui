Version : 0.16.75
Summary : 작업지시서 repository create update 본문 축소
Description : dbWorkOrderRepository.ts의 createDbWorkOrder와 updateDbWorkOrder 내부 insert/update 컬럼 및 assignment 구성 로직을 dbWorkOrderAssignmentBuilders.ts로 이동하고, repository 본문은 정규화·쿼리 실행·후처리 흐름만 남기도록 정리했습니다. 기존 DB schema, 권한, 워크플로우, 버튼 표시 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbWorkOrderAssignmentBuilders.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
