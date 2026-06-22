# Sprint Queue — 0.24.21

## 0.24.22 Productization Sprint #2

### 목표

PB-005, PB-006, PB-010을 중심으로 사용자에게 직접 보이는 관리자/worker 제품화 품질과 Functions 안전 UX를 한 번의 구현 Sprint로 개선한다.

### 필수 범위

1. 고객사 관리자 주요 화면의 WAFL section/filter/table/empty/loading/error 패턴 공통화.
2. 고객사 관리자 dashboard와 `/worker`의 높이·여백·정보 밀도 축소.
3. Functions 화면에 실행 전 environment/profile/safety/dry-run/영향 범위 report 제공.
4. 변경 화면의 responsive·permission·empty/loading/error 계약 보강.

### 선택 범위

- PB-013의 저위험 helper/type 분리.
- CRQ-01/02 범위에서 발견되는 명백한 회귀 수정.

### 제외 범위

- PDF renderer/template 구현.
- final PDF 상태나 retention 결정.
- production R2 repair/delete.
- DB schema/migration.
- 역할 또는 permission 의미 변경.
- 전체 앱 일괄 WAFL 전환.

### 완료 조건

- build PASS.
- mutation audit high-risk 0.
- 관련 WAFL/functions/permission/responsive contract PASS.
- PC와 mobile 핵심 화면 수동 체크 항목 제공.
- commit/push 후 `master = origin/master`, working tree clean.

## 후속 Sprint 후보

### 0.24.23 — Storage/Simulator Productization
- PB-011 dev/test usage fixture.
- 요금제·사용량 시나리오 seed.
- reconciliation와 cleanup preview dry-run.
- production mutation 없음.

### 0.24.24 — Source/Performance Cleanup
- PB-007/PB-013 대형 화면과 domain helper 분리.
- 측정 근거 기반 render scope 축소.

### 0.24.25 — Integrated QA Checkpoint
- PB-004/PB-014.
- Playwright role/responsive matrix 확대.
- iPad mini, Galaxy Tab, iPhone, Android, PC Vercel QA.
- 고객 테스트 전 보완 목록 확정.

## 사용자 결정 항목 처리

정책 결정이 완료되기 전에는 PB-002 final PDF와 production retention/purge를 Sprint 범위에 넣지 않는다. 결정이 내려지면 별도 버전으로 승격한다.
