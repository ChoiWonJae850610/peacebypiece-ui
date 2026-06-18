# Pending tests — 0.23.78

- development/dev/local/test/demo에서 `/dev/test-console` 접근 확인
- production에서 `/dev/test-console` 및 `/api/dev/test-context/*` 차단 확인
- 등록된 시스템관리자 Google 계정으로 콘솔 접속 시 시스템관리자 대상 표시 확인
- 시스템관리자 → 테스트 회사 역할 전환 → 원래 시스템관리자 복귀 확인
- 시스템관리자 전환 후 `/system`, `/system/companies`, `/system/storage-usage` 접근 확인
- 일반 회사 계정이 다른 시스템관리자 계정으로 전환하지 못하는지 확인
- 전환 상태에서 현재 역할·회사 표시 확인
- 전환/복구 audit log 생성 확인
- npm run build 미실행 — 사용자가 로컬에서 확인.
