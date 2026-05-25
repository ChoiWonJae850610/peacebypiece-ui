Version : 0.16.63
Summary : 작업지시서 repository select SQL builder 분리
Description : 작업지시서 DB repository의 select SQL builder 계열을 별도 모듈로 분리하고 APP_VERSION을 0.16.63으로 갱신합니다. DB query 동작, 권한 정책, workflow 정책, 버튼 표시 조건은 변경하지 않습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderSelectSql.ts
삭제 파일 목록 :
- 없음
