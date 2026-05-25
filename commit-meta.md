Version : 0.16.58
Summary : 작업지시서 repository schema column 후보 상수 분리
Description : 작업지시서 DB repository 내부에 누적되어 있던 spec_sheets 컬럼 후보 상수를 dbWorkOrderSchemaColumns로 분리하고, 기존 조회/저장/권한/워크플로우 동작은 변경하지 않았습니다. APP_VERSION을 0.16.58로 갱신했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderSchemaColumns.ts

삭제 파일 목록 :
- 없음
