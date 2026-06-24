# Pending Tests — 0.24.21.12

## 자동 확인 완료
- `node tests/db-readonly-audit-menu-contract.mjs`
- package.json JSON parse
- SQL runner SELECT/WITH allowlist 및 mutation token block 계약
- flat patch ZIP/UTF-8 검증

## 사용자 로컬 확인 필요
1. PowerShell 개발/테스트 도구 메뉴에 30~32가 표시되는지
2. 승인된 dev/test DB에서 메뉴 30 실행
3. 메뉴 31 실행
4. 메뉴 32 실행
5. production runtime 또는 fingerprint mismatch에서 실행이 차단되는지
6. `newest-result`에 결과 파일이 생성되는지
7. canonical pipeline, TypeScript, build 통과

## 주의
- 메뉴 30~32는 읽기 전용이지만 실제 dev/test DB 연결이 필요하다.
- 결과 파일에는 내부 식별자가 포함될 수 있으므로 외부 공유 금지.
