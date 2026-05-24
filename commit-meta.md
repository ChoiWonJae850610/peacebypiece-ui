Version : 0.16.37
Summary : DB 테스트 시드와 검증 SQL 1차 추가
Description : 운영 seed와 분리된 db/test 전용 시나리오 seed를 추가하고, 작업지시서 조회 범위, 워크플로우 상태, 멤버 권한 매트릭스, 회사 범위 격리를 확인하는 검증 SQL을 추가했습니다. APP_VERSION을 0.16.37로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- db/test/scenario_seed.sql
- db/test/verify_workorder_visibility.sql
- db/test/verify_workflow_state.sql
- db/test/verify_permission_matrix.sql
- db/test/verify_company_scope.sql
삭제 파일 목록 :
- 없음
