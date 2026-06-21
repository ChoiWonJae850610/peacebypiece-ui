# Current Baseline Docs

- 기준 앱 버전: `0.24.11`
- 위치: `docs/현재기준/`
- 목적: 기능 작업 전에 우선 확인해야 하는 현재 기준 문서를 모은다.

## 우선 확인 문서

### 프로젝트 구조와 검증

- `리팩토링-규칙.md`
- `소스-구조.md`
- `라우팅-구조.md`
- `워크스페이스-경계.md`
- `testing-and-automation.md`
- `simulator.md`

### UI와 입력 UX

- `wafl-ui-system.md`
- `modal-and-focus.md`
- `wafl-ui-system.md`에는 current responsive/device/layout 기준도 포함한다.

### 작업지시서와 발주

- `workorder.md`
- `material-order.md`
- `작업지시서-상태-구조.md`
- `원단-부자재-데이터베이스-설계.md`
- `원단-부자재-발주-설계.md`

### DB/API

- `데이터베이스-구조.md`
- `데이터베이스-쿼리-인덱스-정책.md`
- `full-reset-검증.md`

### 운영, 정책, 통계

- `초대-정책-설계.md`
- `요금-저장소-정책-설계.md`
- `고객사-통계-지표.md`
- `시스템-통계-지표.md`
- `통계-저장소-구조.md`

## 작업 전 확인 기준

- DB schema 변경은 `full_reset.sql`, migration, smoke test 영향까지 함께 확인한다.
- 화면/레이아웃/권한 변경은 관련 Playwright/E2E 또는 contract 보강 여부를 확인한다.
- R2, 첨부, 메모, 상태, purge 흐름은 직접 목표가 아니면 변경하지 않는다.
- 보관 문서와 현재 기준 문서가 충돌하면 현재 기준 문서를 우선한다.
- 0.24.11 대규모 문서 cleanup은 3차로 종료되었으므로, 남은 root 문서는 대량 이동 대신 개별 필요가 있을 때만 정리한다.
