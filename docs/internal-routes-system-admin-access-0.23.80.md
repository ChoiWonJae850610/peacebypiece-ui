# Internal routes system-admin access — 0.23.80

## 목적

`/dev/test-console`, `/ui`, `/functions`를 개발·테스트 runtime에서만 제공하고, 실제 Google 로그인 이메일이 활성 `system_users.system_admin`으로 등록된 경우에만 접근하도록 통일한다.

## 접근 계약

- 실제 Google 로그인 세션이 존재해야 한다.
- 로그인 이메일이 `system_users.email`과 대소문자 무관하게 일치해야 한다.
- `system_users.role = 'system_admin'`이어야 한다.
- `system_users.is_active = true`여야 한다.
- 각 route의 기존 runtime 제한을 통과해야 한다.
- production, runtime 미설정, 알 수 없는 runtime에서는 `/ui`와 `/functions`를 차단한다.
- `/dev/test-console`은 기존 dev/test console flag와 non-production 조건을 모두 유지한다.

## 세션 전환

접근 판정에는 overlay가 적용된 현재 역할이 아니라 최초 Google 로그인 세션을 사용한다. 따라서 시스템관리자가 테스트 회사 관리자나 멤버로 전환한 뒤에도 내부 route에 다시 접근할 수 있다.

- 회사 역할 전환: 허용된 테스트 회사 대상만 가능
- 시스템관리자 복귀: 원래 로그인 이메일과 같은 시스템관리자 대상만 가능
- 다른 시스템관리자 계정 impersonation: 차단
- Google 로그인 cookie: 유지
- dev/test overlay cookie: 역할 전환에만 사용

## API 보호

`/api/dev/test-context/options`, `/switch`, `/clear`도 동일한 활성 시스템관리자 검사를 수행하며, 허용되지 않은 실제 로그인 세션에는 `403 SYSTEM_ADMIN_REQUIRED`를 반환한다.

## DB/R2

- DB schema 변경 없음
- DB 데이터 변경 없음
- R2 변경 없음
