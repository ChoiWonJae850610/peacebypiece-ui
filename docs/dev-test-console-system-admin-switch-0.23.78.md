# /dev/test-console 시스템관리자 전환 — 0.23.78

## 목적
- 실제 Google 로그인 세션은 유지하면서 dev/test overlay로 시스템관리자와 테스트 회사 역할을 전환한다.
- production에서는 기존과 동일하게 route/API를 차단한다.

## 정책
- 활성 `system_users`의 `system_admin` 계정만 시스템관리자 대상으로 노출한다.
- 실제 로그인 사용자가 이미 시스템관리자이거나 대상 시스템관리자 이메일과 같은 Google 계정일 때만 시스템관리자 전환을 허용한다.
- 일반 회사 계정이 임의의 다른 시스템관리자로 승격하는 요청은 API에서 차단한다.
- 원래 세션 복구를 항상 제공한다.
- 전환/복구는 `audit_logs`에 `dev_test.context_switched`, `dev_test.context_cleared`로 기록한다.
- 토큰, session secret, Google sub는 UI에 노출하지 않는다.

## 확인 경로
- `/dev/test-console`
- 시스템관리자 전환 후 `/system`
- 회사 역할 전환 후 `/workspace`, `/worker`, `/workspace/material-orders`
