# Codex Ready Queue — 0.24.21

## 실행 원칙

Codex는 작은 단편 작업보다 검증 가능한 큰 Sprint 묶음으로 실행한다. 각 queue item은 최신 `master`, clean working tree, matching ZIP/repo-state에서 시작한다.

## Ready Queue

| 순서 | Queue ID | PB | 작업 묶음 | 위험도 | 예상 검증 |
| ---: | --- | --- | --- | --- | --- |
| 1 | CRQ-01 | PB-005, PB-006 | 고객사 관리자 메인·멤버·설정과 `/worker` density/WAFL 공통화 | Q2 | build, WAFL contract, responsive smoke, 수동 PC/mobile |
| 2 | CRQ-02 | PB-010 | Functions 실행 전 report, safety/environment 표시, evidence UX | Q2 | functions contracts, mutation audit, dev/test manual |
| 3 | CRQ-03 | PB-011 | dev/test R2 usage fixture, scenario seed, reconciliation/cleanup dry-run | Q2 | storage contracts, simulator seed, no-production-mutation evidence |
| 4 | CRQ-04 | PB-013, PB-007 | 대형 화면·helper·type 분리와 render scope 축소 | Q1~Q2 | build, targeted regression, file responsibility audit |
| 5 | CRQ-05 | PB-004, PB-014 | Playwright responsive/role matrix 확대와 실기기 QA 준비 | Q2 | E2E, smoke, permissions, device checklist |

## Codex 시작 입력

1. `AGENTS.md`
2. `docs/codex-current-state.md`
3. `docs/project/05-productization-bible.md`
4. `docs/project/07-wafl-component-standard.md`
5. `docs/project/12-release-engineering.md`
6. `docs/project/13-qa-matrix.md`
7. `docs/project/16-pb-breakdown.md`
8. 이 문서와 `18-sprint-queue.md`
9. 해당 roadmap detail

## 공통 금지사항

- production DB/R2 mutation
- 사용자 결정값 임의 확정
- permission 의미 완화
- package/lockfile 변경
- 대량 리팩터링과 기능 변경을 한 commit에 혼합
- build/test 실패를 재시도만으로 숨김

## Queue 승격 조건

Conditional 항목은 사용자 결정 또는 명시된 dev/test 한정 조건이 충족될 때만 Ready로 승격한다. 승격 근거는 roadmap result 또는 별도 decision 문서에 남긴다.
