Version : 0.16.71
Summary : 작업지시서 repository returning column builder 분리
Description : 작업지시서 repository의 반복 RETURNING 컬럼 목록 생성 로직을 dbWorkOrderReturningColumns로 분리하고 create/update/state patch 흐름에서 공통 builder를 사용하도록 정리했습니다. DB query 정책, 권한/역할 정책, workflow 상태 정책, 버튼 표시 조건은 변경하지 않았습니다. npm run build 미실행 — 사용자가 로컬에서 확인.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderReturningColumns.ts

삭제 파일 목록 :
- 없음
