# DB/API smoke test 범위 확장 1차 — 0.19.88

## 목적

0.19.87에서 확인된 DB/API smoke test 성공 기준을 유지하면서, 실제 운영 흐름과 가까운 검증 범위를 추가한다.

이번 버전은 앱 화면 로직이나 API route를 변경하지 않고 `scripts/smoke-db-api.mjs`의 검증 범위만 확장한다. 모든 write 검증은 기존과 동일하게 transaction 내부에서 실행되고 마지막에 rollback된다.

## 확장된 검증 범위

### 1. 멤버 상태 변경 검증

`company_members` 테이블을 schema contract 대상에 추가했다.

확인 컬럼:

- `status`
- `role_template_code`
- `approved_by`, `approved_at`
- `suspended_by`, `suspended_at`
- `withdrawal_requested_by`, `withdrawal_requested_at`
- `withdrawn_by`, `withdrawn_at`

검증 흐름:

1. rollback-only 회사, 관리자 사용자, 일반 멤버 사용자 생성
2. 일반 멤버를 `approved` 상태로 생성
3. 관리자 기준 `suspended` 상태 전환 검증
4. 본인 기준 `withdrawal_requested` 상태 전환 검증
5. 관리자 기준 `withdrawn` 상태 완료 검증

실패 시 `company_members.status`, `company_members.withdrawal_requested`, `company_members.withdrawn` 중 어느 계약이 깨졌는지 출력한다.

### 2. 개인 탈퇴 요청 검증

개인 프로필 화면의 탈퇴 요청 흐름에서 사용하는 DB 계약을 직접 검증한다.

검증 기준:

- `status = 'withdrawal_requested'`
- `withdrawal_requested_by = 요청 사용자 ID`
- `withdrawal_requested_at IS NOT NULL`
- `withdrawn_by IS NULL`
- `withdrawn_at IS NULL`

### 3. 회사 계정 요청 승인/반려 검증

기존 승인 검증을 승인/반려 2개 fixture로 확장했다.

승인 검증:

- `request_status = 'approved'`
- `reviewed_by_system_user_id`가 `system_users.id`와 join됨
- 계정 비활성화 승인 결과로 `companies.is_active = false`
- 계정 비활성화 승인 결과로 `companies.subscription_status = 'canceled'`

반려 검증:

- `request_status = 'rejected'`
- `reviewed_by_system_user_id`가 `system_users.id`와 join됨
- 반려 시 회사가 비활성화되지 않음
- 반려 시 `subscription_status`가 유지됨

### 4. 정책 동의 저장 검증 확장

기존 필수 정책 동의 저장/조회 검증에 upsert 검증을 추가했다.

검증 기준:

- 필수 정책 1건 조회
- 해당 필수 정책 동의 1건 조회
- 같은 `policy_version_id + user_id`에 대해 재저장 시 기존 row가 갱신됨
- `policy_agreements_version_user_unique` 및 `ON CONFLICT` 처리 유효성 확인

## 실행 명령

```bash
npm run test:smoke:db-api
```

## 성공 기준

성공 시 다음 성격의 항목이 Summary에 포함되어야 한다.

- schema contract
- member lifecycle contract
- company account request approval/rejection contract
- policy agreement save/read/upsert contract
- Result: completed successfully
- Persistence: no test data was persisted

## 변경하지 않은 범위

- 앱 기능 로직 변경 없음
- API route 변경 없음
- DB schema 변경 없음
- full_reset.sql 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음

## 다음 단계

0.19.89에서는 Playwright 화면 자동 테스트 범위를 설계한다. 로그인 우회, seed 데이터, 역할별 시나리오, 기존 PowerShell 자동화 스크립트 연결 방식을 문서로 먼저 정리한다.
