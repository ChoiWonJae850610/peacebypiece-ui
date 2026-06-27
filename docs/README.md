# WAFL / PeaceByPiece Docs Index

- 기준 앱 버전: `0.24.25`
- 현재 실행 기준: `docs/codex-current-state.md`
- active 실행계획: `docs/project/31-pre-codex-integrated-master-plan.md`
- GO/STOP 기준: `docs/project/32-pre-codex-authority-consistency-gate.md`
- structured roadmap source: `lib/internal/roadmap/`

## 1. 현재 기준 문서

- `docs/codex-current-state.md`
- `docs/productization-roadmap.md`
- `docs/productization-backlog.md`
- `docs/audits/productization-audit-report-0.24.15.md`
- `docs/audits/source-architecture-cleanup-0.24.23.md`
- `docs/project/01-codex-context.md`
- `docs/project/02-project-decisions.md`
- `docs/project/03-productization.md`
- `docs/project/04-release-checklist.md`
- `docs/project/25-korean-unicode-encoding-standard.md`
- `docs/project/26-final-policy-decisions-and-master-todo.md`
- `docs/project/27-database-schema-query-permission-audit.md`
- `docs/project/28-database-source-of-truth-safe-migration-design.md`
- `docs/project/31-pre-codex-integrated-master-plan.md`
- `docs/project/32-pre-codex-authority-consistency-gate.md`

## 2. 운영 규칙

- repository state, `lib/internal/roadmap/`, `docs/codex-current-state.md`, `docs/project/*` 순서로 authority를 판단합니다.
- 오래된 UI-first 0.24.22 문서는 historical reference입니다.
- DB/R2/Seed/Reset/Cleanup/Migration/production mutation은 별도 승인 없이는 실행하지 않습니다.
- UI/responsive/PDF 변경은 자동 테스트가 통과해도 사용자 확인 전까지 완료 판정하지 않습니다.

## 3. 0.24.24 기준

0.24.24는 WAFL UI Foundation 적용 버전입니다.

- 공통 `WaflStorageUsageMeter` 추가
- 고객사 관리자 메인 저장공간/요금제/구성원 요약 적용
- `/workspace` 카드 밀도와 태블릿 컬럼 기준 조정
- `/worker` WorkOrderWorkspace 및 WAFL empty/loading state boundary 유지
- 권한, tenant, API, repository, DB, R2, package/lockfile 변경 없음

## 4. 0.24.25 기준

0.24.25는 Authorization, Runtime Boundary, and Opaque Routing 적용 버전입니다.

- 서버측 권한 검증과 직접 URL/API 우회 차단
- production dev/test account switching 차단과 서버 runtime 판정
- opaque-compatible workorder route parameter validation
- DB migration, DB/R2 mutation, Cloudflare Worker 변경 없음
- 0.24.24.1 simulator 감사 문서: `docs/audits/simulator-attachment-r2-lifecycle-0.24.24.1.md`
