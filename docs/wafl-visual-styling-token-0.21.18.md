# WAFL visual styling token 0.21.18

## 목적

WAFL shape token을 유지한 상태에서 화면별 직접 꾸밈 class를 늘리지 않고 `tone`, `variant`, `selected`, `disabled` 기준으로 시각 구분을 통제한다.

## 적용 기준

- shape는 `surface`, `control`, `compact`, `icon` token 기준을 유지한다.
- 색상 의미는 `tone`으로만 분리한다.
- 버튼 강도는 `variant`로만 분리한다.
- `selected` / `current` / `disabled` / `danger` 상태는 공통 컴포넌트 props와 WAFL token class로 표현한다.
- depth는 shadow가 아니라 border/background 차이로 최소화한다.

## 0.21.18 변경

- `/ui`에 `Visual styling · 꾸밈 기준` 섹션을 추가했다.
- `WaflButton`에 `neutral` variant를 추가해 일반 실행 버튼과 보조 버튼을 분리했다.
- `WaflSurface` tone을 `default`, `selected`, `warning`, `danger`, `info`까지 확장했다.
- 작업지시서 모바일 진행 action section의 panel/action/badge를 WAFL 컴포넌트 기준으로 정리했다.
- 작업지시서 비용 요약의 모바일/태블릿/기본 row와 total 영역을 WAFL Surface/InfoRow/EmptyCard 기준으로 연결했다.
- 작업지시서 목록 선택 카드에 `WaflSurface tone=selected/muted` 기준을 연결했다.

## 모바일 확인 기준

현재 테스트 확인은 모바일 우선이다.

- `/ui`에서 Visual styling 섹션이 세로 스크롤로 자연스럽게 보이는지 확인한다.
- 작업지시서 목록에서 선택된 카드가 너무 강하거나 흐리지 않은지 확인한다.
- 작업지시서 상세의 진행 단계 현재/완료 표시가 모바일에서 읽히는지 확인한다.
- 비용 요약 총 비용과 일반 row 구분이 모바일에서 충분한지 확인한다.
- 버튼 높이가 모바일 터치에 충분한지 확인한다.
