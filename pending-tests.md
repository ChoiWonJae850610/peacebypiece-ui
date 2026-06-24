# Pending Tests — 0.24.21.11

- 로컬에서 `node tests/db-safe-migration-design-contract.mjs` 실행
- 로컬에서 `node tests/unicode-encoding-contract.mjs` 실행
- `/roadmap`에서 현재 0.24.21.11, 다음 0.24.22 표시 확인
- `docs/project/28-database-source-of-truth-safe-migration-design.md` 열람 확인
- reconciliation SQL이 SELECT-only인지 확인
- safe DDL draft의 모든 DDL/DML이 주석 처리되었는지 확인
- DB/R2/migration/reset/seed/cleanup 실행 금지
- 실제 migration 전 dev/test schema drift, reconciliation, EXPLAIN evidence 별도 수행
