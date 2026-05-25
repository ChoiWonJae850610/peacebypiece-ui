Version : 0.16.68
Summary : 작업지시서 repository 삭제 helper 분리
Description : 작업지시서 삭제/soft-delete 계열 helper를 별도 파일로 분리하고, APP_VERSION을 0.16.68로 갱신했습니다. DB query 정책, 권한/역할 정책, workflow 상태 정책, 버튼 표시 조건은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderDeleteHelpers.ts
삭제 파일 목록 :
- 없음
