# WAFL DataTable 공통화 1차 — 0.19.34

## 목적

멤버관리, 협력업체관리, 저장소관리 등 반복되는 table/list UI의 shell, header, row, compact card 스타일을 WAFL 공통 컴포넌트 기준으로 중앙화한다.

## 적용 기준

- `WaflDataTableShell`: table/list 외곽 wrapper
- `WaflDataTableHeader`: wide table header
- `WaflDataTableBody`: divider body
- `WaflDataTableRow`: wide table row
- compact card/meta style constants: 모바일/좁은 화면 카드형 목록 재사용

## 규칙

- 색상, border, radius, shadow, row height, header tone은 WAFL theme token 기준을 사용한다.
- 기존 responsive table 스타일은 `WaflDataTable` export를 경유하는 compatibility layer로 유지한다.
- 화면별 TSX는 컬럼, children, grid template만 넘기고 table 형태 자체는 공통 컴포넌트가 결정한다.
- DB/API/R2/권한/상태 흐름은 변경하지 않는다.

## 이번 적용 범위

- 멤버 목록 wide table
- 협력업체 목록 wide table
- 저장소 휴지통 wide table
- 기존 `AdminTable` 기본 shell/header/row/divider class
