# WAFL Table 세부 밀도 보정 0.19.42

## 목적

고객사 관리자 주요 화면의 wide table과 compact card 전환 UI가 같은 밀도와 정렬 기준을 사용하도록 `WaflDataTable` 기준값을 보정한다.

## 공통 기준

- table shell: 기존 WAFL shell 유지
- header: `min-h-10`, `px-4`, `py-2.5`, `text-[11px]`, `gap-3.5`
- row: `min-h-[48px]`, `px-4`, `py-2.5`, `gap-3.5`
- header button: `min-h-7`, `px-2`, `py-1`
- cell: `min-w-0 max-w-full overflow-hidden`
- compact card: `px-3.5 py-3`
- compact meta box: `px-3 py-2.5`

## 적용 범위

- `AdminTable` 공통 header/cell wrapper
- 멤버관리 wide/compact responsive rows
- 저장소 휴지통 wide table header select cell
- responsive table alias는 기존 export 구조 유지

## 제외 범위

- DB/API/R2/첨부/메모/휴지통 동작
- 작업지시서/원단부자재 세부 테이블 구조
- 환경설정 화면
