Version : 0.16.74
Summary : 작업지시서 repository mutation SQL builder 분리
Description : 작업지시서 create/update/state patch mutation SQL 문자열 생성을 dbWorkOrderMutationSql로 분리하고 dbWorkOrderRepository 본문을 축소했습니다. DB schema, 권한, 워크플로우, 버튼 표시 정책은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderMutationSql.ts
삭제 파일 목록 :
- 없음
