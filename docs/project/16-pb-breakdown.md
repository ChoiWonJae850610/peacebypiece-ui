# PB Breakdown — 0.24.21

## 목적

0.24.15 Productization Audit의 PB 항목을 Codex가 실제 구현 가능한 단위로 분해한다. 이 문서는 정책 결정과 구현 작업을 섞지 않고, 각 PB의 목적·범위·의존성·위험도·완료 조건을 고정한다.

## 상태 정의

| 상태 | 의미 |
| --- | --- |
| Ready | 정책과 선행조건이 충족되어 구현 가능 |
| Conditional | 일부 구현 가능하나 사용자 결정 또는 실기기 확인 필요 |
| Blocked | 정책·권한·production 접근 결정 전 구현 금지 |
| Done | 구현·검증·commit·push와 필요한 사용자 확인 완료 |

## 구현 준비 PB

### PB-005 — 관리자 주요 화면 WAFL 공통화
- 상태: Ready
- 목적: section, filter, table, empty/loading/error 상태를 WAFL 공통 컴포넌트로 통일한다.
- 1차 범위: 고객사 관리자 대시보드, 멤버 관리, 회사 파일/설정 화면의 반복 패턴.
- 제외: 권한 의미 변경, API/DB 변경, 전체 화면 일괄 재작성.
- 의존성: `07-wafl-component-standard.md`, 기존 화면별 responsive 계약.
- 위험도: Q2.
- 완료 조건: 화면별 로컬 중복 감소, 기존 동작·권한 유지, build/contract PASS, PC·모바일 수동 확인 항목 기록.

### PB-006 — `/worker`, `/workspace`, 관리자 dashboard 정보 밀도 정리
- 상태: Ready
- 목적: 핵심 정보는 유지하면서 과도한 높이·여백·중복 설명을 줄인다.
- 1차 범위: `/worker` 상단·리스트·상태 패널, 고객사 관리자 메인 summary/action 영역.
- 제외: 업무 단계 변경, 저장 흐름 변경, DB/API 변경.
- 의존성: Browser/Device Matrix, 기존 workspace shell 계약.
- 위험도: Q2.
- 완료 조건: PC/태블릿/모바일 breakpoint별 기준 충족, 스크롤·focus 회귀 없음.

### PB-010 — Functions 실행 전 report와 안전 등급 UX
- 상태: Ready
- 목적: 명령 실행 전에 환경·profile·safety·dry-run·영향 범위를 명확히 표시한다.
- 1차 범위: 조회/검증 명령과 dev/test 제한 명령의 report UI.
- 제외: production destructive 실행, 자동 승인 확대, 신규 권한 부여.
- 의존성: Functions catalog, PowerShell canonical script.
- 위험도: Q2.
- 완료 조건: 실행 전 report, environment restriction, 결과 evidence 링크, destructive guard 유지.

### PB-011 — R2 usage fixture와 reconciliation dry-run
- 상태: Conditional
- 목적: 요금제·시나리오별 저장공간 그래프와 metadata/object 불일치를 안전하게 검증한다.
- 구현 가능 범위: dev/test fixture, dry-run preview, 차이 보고서.
- 차단 범위: production delete/repair, 실제 quota 정책 변경.
- 의존성: R2 Storage Policy, Simulator/Seed 기준.
- 위험도: Q2, production은 Q3.
- 완료 조건: 시나리오별 사용량 재현, mutation 없는 reconciliation report, cleanup preview.

### PB-013 — 대형 화면 render scope 축소
- 상태: Ready
- 목적: 대형 catalog/settings/admin 화면의 불필요한 재렌더와 유지보수 위험을 낮춘다.
- 범위: 정적 데이터·타입·표현 helper 분리, memoization은 측정 근거가 있는 곳만 적용.
- 제외: 전역 상태 라이브러리 도입, dependency 변경.
- 위험도: Q1~Q2.
- 완료 조건: 파일 책임 분리, 기능 회귀 없음, build PASS.

## 조건부·보류 PB

### PB-002 — PDF/R2 최종 정책과 엔진
- 상태: Conditional
- 완료된 기반: PDF Specification, R2 Storage Policy.
- 사용자 결정 필요: 최종 PDF 생성 단계, final/superseded 보존기간, 계정 종료 grace/purge.
- 결정 전 허용: renderer contract, template fixture, draft-only dev/test 구현.
- 결정 전 금지: final 생성 정책 확정, production retention/purge 실행.

### PB-004 — 실기기 responsive QA
- 상태: Conditional
- 자동 준비는 가능하나 iPad mini, Galaxy Tab, iPhone, Android 실기기 확인이 완료 조건이다.

### PB-001 — Runtime/Permission 의미 재검증
- 상태: Conditional
- read-only audit와 contract 보강은 가능하다.
- 권한 의미 변경, support access 확대, system-admin customer content 접근은 사용자 결정 없이 금지한다.

### PB-003 / PB-007 / PB-008 / PB-009 / PB-012 / PB-014 / PB-016 / PB-017
- 기존 Sprint에서 일부 기반이 완료되었거나 후속 audit/cleanup 단위로 유지한다.
- 0.24.22에서는 PB-005/006/010/011/013보다 우선하지 않는다.

## DB Migration

없음. 0.24.21은 계획·문서·roadmap 정리 버전이다.
