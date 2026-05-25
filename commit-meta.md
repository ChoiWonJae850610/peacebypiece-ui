Version : 0.16.57
Summary : 작업지시서 repository 계약 타입 분리
Description : 0.16.56 기준 작업지시서 repository read/write 경계에서 공통 조회 옵션 타입을 별도 contracts 파일로 분리하고, read repository가 상위 repository 타입을 다시 참조하지 않도록 import 경계를 보정하였습니다. APP_VERSION을 0.16.57로 갱신했습니다. npm run build 미실행 — 사용자가 로컬에서 확인.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderReadRepository.ts
- lib/workorder/repository/workOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/workOrderRepositoryContracts.ts
삭제 파일 목록 :
- 없음
