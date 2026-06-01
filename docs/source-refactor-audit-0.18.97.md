# 0.18.97 전체 소스 리팩토링 감사 1차

## 목적

테스트 불가 또는 부분 가능 전환 구간에서 기능 흐름을 건드리지 않고, 이후 기능 개발 전에 공통화가 필요한 지점을 먼저 분류한다.

이번 버전은 실제 리팩토링 적용이 아니라 감사 문서 작성이 목표다. DB/API/R2/권한/상태 전환/첨부/메모/휴지통/purge 흐름은 변경하지 않는다.

## 정적 점검 범위

- `app/`: route, page, API route, dev route
- `components/`: admin, system, workspace, workorder, common UI
- `lib/`: domain logic, repository, presentation, formatter, permission, storage

## 1차 정적 지표

아래 수치는 0.18.96 소스 zip 기준으로 확인한 리팩토링 후보 탐색용 지표다. 정확한 품질 판단이 아니라 우선순위 선별용이다.

| 항목 | 확인 결과 | 해석 |
| --- | ---: | --- |
| `app/components/lib`의 `.ts/.tsx` 파일 | 936개 | 화면·도메인 코드가 충분히 커져 공통화 기준이 필요함 |
| `className="` 직접 사용 | 2,682회 | 공통 shell/variant/class utility 적용 여지가 큼 |
| `status ===` 직접 비교 | 193회 | 도메인 status mapper/상수화 후보가 많음 |
| `role ===` 직접 비교 | 37회 | session/role helper로 모을 후보가 있음 |
| `toLocaleString` 직접 사용 | 87회 | 날짜/금액/수량 formatter 중복 가능성 있음 |
| `formatDate` 문자열 | 30회 | formatter 위치·사용 기준 통일 필요 |
| `formatCurrency` 문자열 | 40회 | 금액 formatter 중복/표시 기준 통일 필요 |
| 직접 `<table` 사용 | 5개 파일 | AdminTable 또는 전용 print/document table과 경계 필요 |
| `<AdminTable` 사용 | 12개 파일 | 공통 table 적용은 이미 시작됨 |
| `<AdminModal` 사용 | 36개 파일 | modal shell 통일은 진행 중이나 적용 규칙 문서화 필요 |
| `<BaseModal` 사용 | 3개 파일 | legacy/common modal 경계 확인 필요 |

## 우선 리팩토링 후보

### 1. 공통 Table/List/Card 규칙

현재 저장소관리, 협력업체관리, 멤버관리, 통계정보에서 각각 table/list/card 전환 기준을 별도로 다듬은 흔적이 있다. 다음 개발 전에는 공통 기준을 먼저 확정하는 편이 안전하다.

권장 방향:

- PC: table 우선
- 좁은 container: compact table 또는 card/list 전환
- 모바일: row card 또는 stacked list 우선
- print/PDF 문서용 table은 AdminTable과 분리
- `overflow-x-auto`는 임시 회피책으로 남발하지 않고 화면별 허용 기준을 둔다.

후보 파일군:

- `components/admin/files/*`
- `components/admin/partnerMaster/*`
- `components/admin/members/*`
- `components/admin/dashboard/*`
- `components/system/*`
- `components/tables/*`
- `components/common/modal/orderRequest/*`

### 2. 공통 Modal 규칙

`AdminModal`, `BaseModal`, 개별 modal shell이 공존한다. 지금 바로 통합하면 회귀 위험이 있으므로 먼저 역할을 나눈다.

권장 방향:

- 관리자/시스템/환경설정 계열: `AdminModal` 우선
- 작업지시서 업무 모달: 기존 `components/common/modal/*` 안정 흐름 유지
- 첨부/미리보기/문서 preview: 전용 modal 유지 가능
- 공통 규칙은 scroll lock, focus trap, Escape close, mobile top close, footer action 정렬만 먼저 문서화한다.

### 3. Button/Action/Pending 규칙

관리자 버튼류는 `AdminButton`, `AdminIconActionButton`, action bar류가 생겼으나, 이동 카드/홈 버튼/pending navigation은 아직 별도 기준이 필요하다.

권장 방향:

- destructive action은 confirm modal 또는 confirm copy 규칙 필수
- 이동형 카드/버튼은 pending feedback 공통 컴포넌트 후보로 분리
- disabled/WIP 상태는 화면별 문구가 아니라 공통 disabled presentation 기준 적용

### 4. Status/Role/Permission 상수화

`status ===`, `role ===` 직접 비교가 여러 영역에 남아 있다. 모든 문자열 비교를 한 번에 제거하면 위험하므로 도메인별로 나눠야 한다.

권장 순서:

1. 표시용 mapper부터 분리: badge variant, label, description
2. 권한 판단 helper 분리: company admin, system admin, member active 등
3. 상태 전환 로직은 테스트 가능 전까지 변경 보류
4. API route의 guard는 thin하게 유지하되 helper로 공통화

### 5. Formatter/Label helper

날짜, 금액, 파일크기, 수량, 퍼센트, 기간 label이 여러 위치에 흩어질 가능성이 있다.

권장 방향:

- `lib/formatters` 또는 기존 formatter 위치를 기준으로 정리
- UI 컴포넌트에서는 formatter 결과를 받아 표시하거나 공통 formatter만 호출
- locale별 label은 i18n/label helper와 경계를 명확히 둔다.

### 6. 화면 TSX 책임 축소

최근 통계정보에서 section 분리와 hook 분리를 진행한 것처럼, 큰 화면 컴포넌트는 조립 역할 중심으로 줄이는 것이 맞다.

권장 방향:

- page: 인증/session/load 위주
- dashboard/client: 상태 조합과 section 배치
- section: 화면 렌더링
- hook/helper: handler, derived state, filter, sort
- lib domain: DB/API/R2/권한/상태 계산

## 실제 적용 우선순위 제안

테스트 가능 상태가 명확해지기 전까지는 아래 순서가 안전하다.

1. 공통 규칙 문서화
2. formatter/label처럼 UI 회귀가 작은 helper 정리
3. 이미 최근에 만진 통계정보/저장소관리/협력업체관리부터 shell 기준 정리
4. 멤버관리/환경설정 개발 전 공통 component 적용
5. 작업지시서/원단부자재는 기능 회귀 위험이 커서 마지막에 좁게 적용

## 다음 패치 후보

- 0.18.98: 공통 UI 규칙 문서 추가
- 0.18.99: formatter/label helper 위치 점검 및 저위험 정리
- 0.19.00: AdminTable/Card/List shell 적용 후보 문서화 또는 좁은 범위 적용
- 0.19.01: Modal/action footer 규칙 점검

## 보류 항목

테스트 가능하다고 명시되기 전까지 아래는 보류한다.

- DB schema 변경
- API guard 동작 변경
- 권한/role 실제 판단 로직 변경
- 작업지시서 상태 전환 리팩토링
- R2/첨부/메모/삭제/복원/purge 흐름 변경
- 원단부자재 발주 계산식 변경
