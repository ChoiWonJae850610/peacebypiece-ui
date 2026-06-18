# Pending tests — 0.23.81

- 활성 `system_users.system_admin` Google 이메일로 로그인 후 `/dev/test-console` 접근 확인
- 같은 계정으로 `/ui`, `/functions` 접근 확인
- 고객사 관리자 및 일반 멤버 Google 계정에서 세 route가 차단되는지 확인
- production 또는 runtime 미허용 상태에서 `/ui`, `/functions`, `/dev/test-console` 차단 확인
- 시스템관리자 → 테스트 회사 관리자/멤버 전환 후 `/dev/test-console`, `/ui`, `/functions` 재접근 확인
- 원래 사용자 복구 후 `/system` 접근 확인
- 다른 활성 시스템관리자 계정이 전환 목록에 노출되거나 전환되지 않는지 확인
- `/api/dev/test-context/options`, `/switch`, `/clear`의 403 `SYSTEM_ADMIN_REQUIRED` 확인
- 전환/복귀 audit log 확인
- Seed 회사 역할이 `company_members` 기반 콘솔 대상 목록에 실제 표시되는지 후속 확인
- PowerShell 개발·테스트 도구 9번 `Reset Database Schema` 재실행
- `full_reset.sql`, `scenario_seed.sql`, `scenario_google_login_seed.sql`, `system_admin_bootstrap_kty872.sql` 4개 모두 OK 확인
- Reset 후 수정한 시스템관리자 Google 이메일로 로그인 확인
- npm run build 미실행 — 사용자가 로컬에서 확인.
