# Pending Tests — 0.24.21.14

## 수정 확인
- reconciliation: 상세 결과 행 합계가 0이면 성공
- constraints: `issue_count` 합계가 0이면 성공
- indexes: 보고서 조회 성공 시 결과 행 수와 무관하게 성공
- 기존 dev/test 환경·DB fingerprint·READ ONLY guard 유지

## 사용자 로컬 확인 필요
1. `npm run build` 통과
2. `node tests/db-readonly-audit-menu-contract.mjs` 통과
3. PowerShell 메뉴 30 실행 후 OK 파일 생성
4. PowerShell 메뉴 31 실행 후 `Total reported issues: 0` 및 OK 파일 생성
5. PowerShell 메뉴 32 실행 후 결과 행이 있어도 OK 파일 생성
6. `/roadmap` 현재 버전 `0.24.21.14`, 다음 버전 `0.24.22` 확인
7. 정상 시 commit 후 `origin/master` push

## 후속 TODO
- DATABASE_URL의 SSL mode 경고를 운영 환경 준비 단계에서 `sslmode=verify-full` 기준으로 정리

## DB/R2
- DB Migration 없음
- DB는 READ ONLY 조회만 수행
- R2 접근·변경 없음
