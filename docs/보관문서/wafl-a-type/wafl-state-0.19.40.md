# WAFL Empty / Loading / Error 상태 공통화 0.19.40

## 목적

빈 목록, 로딩, 오류, 접근 불가 상태를 화면별 직접 마크업이 아니라 WAFL 공통 상태 컴포넌트 기준으로 정리한다.

## 공통 컴포넌트

- `components/common/ui/WaflState.tsx`
  - `WaflStateBlock`
  - `WaflEmptyState`
  - `WaflLoadingState`
  - `WaflErrorState`
  - `WaflForbiddenState`

## 적용 범위

- `AdminEmptyState`
- `AdminTableState`
- `AdminTable` loading state
- 멤버관리 responsive rows loading/empty state
- 저장소 휴지통 compact empty state
- 작업지시서 empty/loading state

## 제한

- DB/API/R2/첨부/메모/휴지통 처리 흐름은 변경하지 않는다.
- 작업지시서 3패널 구조는 유지한다.
- 화면별 상태 문구와 i18n 키는 기존 값을 유지한다.
