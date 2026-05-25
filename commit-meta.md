Version : 0.16.64
Summary : 작업지시서 repository select SQL builder 빌드 오류 보정
Description : 0.16.63에서 select SQL builder 분리 중 dbWorkOrderRepository.ts에 남은 불완전한 select query fragment를 제거하고, dbWorkOrderSelectSql.ts의 export 함수 본문을 복구했습니다. DB query 정책, 권한, 역할, workflow 동작은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음
