# Pending Tests — 0.24.21.13

## 수정 확인
- `roadmap-0.24.21.12.ts`가 `RoadmapVersionDetail` 정식 필드만 사용하도록 수정됨
- `dbNotes`, `storageImpact`, `storageNotes`, `testPlan`, `files` 제거
- `dbImpactNotes`, `r2Impact`, `r2ImpactNotes`, `migrationRequired`, `automaticTests`, `manualTests`, `expectedChangeAreas`, `result` 추가

## 사용자 로컬 확인 필요
1. `npm run build` 통과
2. `node tests/db-readonly-audit-menu-contract.mjs` 통과
3. `/roadmap` 현재 버전 `0.24.21.13`, 다음 버전 `0.24.22` 확인
4. PowerShell 메뉴 30~32 유지 확인
5. 정상 시 commit 후 `origin/master` push

## DB/R2
- DB Migration 없음
- DB/R2 접근·변경 없음
