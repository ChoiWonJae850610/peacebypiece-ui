# 현재기준 문서

- 기준 앱 버전: `0.24.11`
- 위치: `docs/현재기준/`
- 목적: 기능 작업 전에 현재 구현 기준과 검증 기준을 확인한다.

## 우선순위

새 버전 기능 작업은 먼저 `lib/internal/roadmap/`의 canonical 상세 명세를 읽고, 그 다음 이 현재기준 문서를 확인한다.

충돌이 있으면 다음 순서를 따른다.

1. local Git state
2. `lib/internal/roadmap/*`
3. `docs/codex-current-state.md`
4. 이 `docs/현재기준/*` 문서
5. 보관/이력 문서

## 핵심 문서

- `workorder.md`
- `material-order.md`
- `modal-and-focus.md`
- `wafl-ui-system.md`
- `testing-and-automation.md`
- `simulator.md`
- `워크스페이스-경계.md`
- `라우팅-구조.md`
- `데이터베이스-구조.md`
- `데이터베이스-쿼리-인덱스-정책.md`

## 작업 전 확인 기준

- 화면, layout, responsive 변경은 관련 contract 또는 수동 검증 기준을 함께 확인한다.
- DB schema 변경은 migration, full reset, smoke test 영향을 먼저 확인한다.
- R2, PDF, attachment, purge, Seed, Reset, Cleanup, Migration 실행은 명시 승인 없이 진행하지 않는다.
- UI, 반응형, PDF처럼 사람 판단이 필요한 작업은 사용자 확인 전 완료로 처리하지 않는다.
