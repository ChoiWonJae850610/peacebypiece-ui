# 0.19.77 회사 계정 요청 시스템관리자 검토자 FK 보정

## 목적

`/system/account-requests`에서 회사 계정 요청을 검토 중/승인/반려 처리할 때
시스템관리자 계정이 `users` 테이블이 아니라 `system_users` 테이블 기준으로 로그인되는 구조를 반영한다.

## 원인

0.19.76의 `company_account_requests.reviewed_by_user_id`는 `users(id)`를 참조했다.
하지만 시스템관리자 세션의 `userId`는 `system_users(id)`에서 나온다.
따라서 시스템관리자가 요청을 처리하면 `reviewed_by_user_id` FK가 깨질 수 있다.

## 보정 내용

- `company_account_requests.reviewed_by_system_user_id` 컬럼 추가
- 신규 컬럼은 `system_users(id)`를 참조
- 시스템관리자 요청 처리 API는 `reviewed_by_system_user_id`에 검토자 ID를 저장
- 시스템관리자 검토 화면 조회는 `system_users`에서 검토자 이름을 가져옴
- 기존 `reviewed_by_user_id` 컬럼은 고객사 사용자 기준 기록 가능성을 위해 유지하되, 시스템관리자 처리 시에는 `NULL`로 둠
- `full_reset.sql`, `full_reset_smoke_test.sql`, migration 동시 반영

## 테스트 기준

1. `db/migrations/patch_0_19_77_company_account_request_system_reviewer.sql` 적용
2. `/system/account-requests` 진입
3. 접수됨 요청 선택
4. 검토 중 처리
5. 승인 처리
6. 반려 처리
7. 더 이상 `company_account_requests_reviewed_by_user_id_fkey` 오류가 나지 않는지 확인
8. 검토자 이름이 시스템관리자 이름으로 표시되는지 확인
