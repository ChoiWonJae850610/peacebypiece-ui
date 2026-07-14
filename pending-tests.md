# Pending Tests — 0.24.21.19

## WAFL v2 alpha.40 completed automation and remaining user QA

- Automated PASS: 320/390/768 material action density and overflow, two Expo Web popup entry points, rapid-click popup suppression, sample Preview image/color de-duplication, three-page sample PDF inspection, authenticated actual PDF inline/download integrity, tenant blocking, and browser console warning/error zero.
- Automated PASS: actual retained PDF inline/download size and SHA match, R2 GET 2, DB/R2 write 0, generated-document/token mutation 0, and production access 0.
- User QA retained: physical iPhone/iPad/Galaxy touch comfort, downloaded PDF opening in native viewers, and visual judgment of the compact action spacing.
- Production PDF delivery, production R2, actual customer documents, new PDF generation, embedded QR generation, and mobile API persistence remain NOT_RUN.

## WAFL v2 alpha.39 completed automation and remaining manual QA

- Automated PASS: migration 011 ledger 11/11 and function ACL, two hash-only token rows, three bounded updates, five events, three R2 GETs, inline/download integrity, immediate revoke/rotation, generic NOT_FOUND, access accounting, tenant isolation, and generated-document/R2/production mutation 0.
- Automated PASS: viewer fragment removal and no UUID/key/hash/signed-URL response contract. Final physical browser presentation and network-panel review remain user QA.
- Scan the generated QR with a real phone camera. Static matrix/SVG evidence must not be reported as a physical scan PASS.
- Production migration, production R2, real customer documents, mobile document download/share, and device PDF opening remain NOT_RUN.

## 자동 검증
- `node tests/pre-codex-final-contract-gate-contract.mjs`
- `node tests/document-structure-contract.mjs`
- `node tests/workspace-commonization-contract.mjs`
- `node tests/system-admin-internal-access-contract.mjs`
- `node tests/roadmap-development-contract.mjs`
- `node tests/unicode-encoding-contract.mjs`
- `node tests/pipeline-powershell-encoding-contract.mjs`

## 사용자 로컬 확인
1. PowerShell 메인 메뉴 `5` → 개발/테스트 도구 `33` 실행
2. 결과 파일 `OK_Pre_Codex_Final_Contract_Gate_0.24.21.19-*.txt` 확인
3. PowerShell 메인 메뉴 `5` → 개발/테스트 도구 `2` NPM Build 실행
4. `/roadmap` 현재 `0.24.21.19`, 다음 `0.24.22` 확인
5. `/functions`에 `조회만 가능` 안내 확인
6. 왼쪽 아래 개발 모드 Issue가 있으면 상세 내용 확인
