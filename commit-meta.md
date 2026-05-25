Version : 0.16.62
Summary : 작업지시서 repository schema reader 분리
Description : 0.16.61 기준에서 작업지시서 repository의 spec_sheets schema load/assert 계열을 별도 schema reader 파일로 분리하고 APP_VERSION을 0.16.62로 갱신했습니다. DB query, 권한, 역할, workflow 정책은 변경하지 않았습니다. npm run build는 ChatGPT/container에서 실행하지 않았으며 사용자가 로컬에서 확인합니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderSchemaReader.ts
삭제 파일 목록 :
- 없음
