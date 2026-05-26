# Dev test console reset SQL order

Version: 0.17.6

`/dev/test-console`을 사용하려면 Google 로그인으로 먼저 앱에 들어올 수 있는 실제 Gmail 1개가 필요하고, 그 뒤 앱 내부 업무 컨텍스트를 테스트 fixture 사용자로 전환합니다.

## Fresh reset order

개발 DB를 완전히 리셋한 뒤 현재 테스트 화면까지 보려면 아래 순서로 실행합니다.

1. `db/schema/full_reset.sql`
   - 전체 schema, catalog, baseline seed를 초기화합니다.

2. `db/schema/full_reset_smoke_test.sql`
   - full reset 직후 핵심 table/view/index/catalog가 정상인지 확인합니다.

3. `db/test/scenario_seed.sql`
   - TEST A/TEST B 고객사, 멤버, 권한, 협력업체, 작업지시서 fixture를 생성합니다.

4. 선택 검증 SQL
   - `db/test/verify_company_scope.sql`
   - `db/test/verify_permission_matrix.sql`
   - `db/test/verify_workflow_state.sql`
   - `db/test/verify_workorder_visibility.sql`

5. `db/test/scenario_google_login_seed.sql`
   - 실행 전에 `TEST_CUSTOMER_ADMIN_EMAIL@gmail.com`을 실제 Google 로그인 Gmail로 바꿉니다.
   - 선택 테스트 계정도 실제 Gmail로 연결하려면 다른 `TEST_*` placeholder도 각각 다른 Gmail로 바꿉니다.
   - 최소 1개 실제 Gmail만 있으면 `/dev/test-console`에서 다른 fixture 사용자로 전환할 수 있습니다.

6. `db/test/verify_google_login_seed.sql`
   - 실제 Gmail bridge와 승인 완료 고객사 관리자 진입 조건을 확인합니다.

7. 브라우저에서 실제 Gmail로 로그인
   - 첫 로그인 시 `google_sub`가 연결됩니다.

8. `/dev/test-console` 접속
   - 실제 Google 로그인은 유지한 채 앱 내부 업무 컨텍스트만 테스트 fixture 사용자로 전환합니다.

## Optional SQL

- `db/seed/system_admin_bootstrap_kty872.sql`
  - 시스템 관리자 계정도 같이 테스트해야 할 때만 실행합니다.

- `db/seed/system_standards_seed.sql`
  - 기존 DB에 시스템 기준정보만 보강할 때 사용합니다. fresh `full_reset.sql` 직후에는 보통 별도 실행이 필요 없습니다.

## Notes

- 운영 DB에서 실행하지 않습니다.
- `scenario_google_login_seed.sql`은 Google 로그인을 우회하지 않습니다.
- 테스트 콘솔은 production에서 비활성화되어야 합니다.
