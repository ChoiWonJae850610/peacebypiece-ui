Version : 0.16.73
Summary : 작업지시서 repository state patch assignment 분리
Description : 작업지시서 상태 패치 update assignment 생성 로직을 별도 helper로 분리하고 APP_VERSION을 0.16.73으로 갱신했습니다. DB query 정책, 권한/역할 정책, workflow 상태 정책, 버튼 표시 조건, DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderStatePatchAssignments.ts
삭제 파일 목록 :
- 없음
