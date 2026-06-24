# Pending Tests — 0.24.21.18

## 자동/로컬 검증

- `node tests/roadmap-development-contract.mjs`
- `node tests/unicode-encoding-contract.mjs`
- `npm run build`
- APP_VERSION, README, docs index, roadmap current/next version 일치
- package/lockfile 무변경 확인

## 문서·roadmap 확인

- `/roadmap` 현재 버전 `0.24.21.18`, 다음 버전 `0.24.22` 확인
- `0.24.22 DB Foundation and Authority Alignment` 상세가 표시되는지 확인
- 문서 31 섹션 번호가 1~8로 중복 없이 표시되는지 확인
- 문서 28의 GO 제목이 DB Foundation 기준인지 확인
- 문서 31이 active execution authority, 문서 32가 GO/STOP gate로 표시되는지 확인
- 과거 0.24.11이 진행 중이 아니라 완료로 표시되는지 확인

## 다음 Sprint 진입 확인

- PowerShell 메뉴 30~32 read-only 감사 유지
- 실제 migration은 0.24.22에서 직접 실행하지 않고 별도 승인 버전으로 분리
- 검증 후 commit/push 및 Vercel QA 배포 확인
