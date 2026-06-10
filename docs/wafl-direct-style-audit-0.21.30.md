# WAFL Direct Style Audit 0.21.30

## 목적

0.21.30은 WAFL Foundation을 작업지시서, 발주, 저장소/첨부, 통계, 멤버관리까지 확장한 뒤 남은 직접 스타일 후보를 점검하는 버전이다.

이번 버전의 목표는 모든 잔여 class를 한 번에 제거하는 것이 아니라 다음 두 가지를 분리하는 것이다.

1. 제거 대상: WAFL 컴포넌트 prop, shape, density, tone, variant, state로 대체 가능한 직접 스타일
2. 예외 대상: 실제 원형 의미, 차트 primitive, calendar range, layout-only class처럼 직접 스타일이 남아도 되는 후보

## 0.21.30 scan 기준

source scan은 다음 후보를 기준으로 했다.

- `rounded-*`, `rounded[...]`
- `bg-blue/red/yellow/rose/amber/green/emerald/sky/slate/stone-*`
- `text-blue/red/yellow/rose/amber/green/emerald/sky/slate/stone-*`
- `border-blue/red/yellow/rose/amber/green/emerald/sky/slate/stone-*`
- 직접 `<button>`, `<input>`, `<select>`, `<textarea>` className

숫자는 잔여 후보 수이며, 예외가 섞여 있다. 따라서 전부 오류라는 뜻은 아니다.

## 영역별 후보

| 영역 | scope | 잔여 후보 | 판정 |
| --- | --- | ---: | --- |
| 작업지시서 | `components/workorder` | rounded 69 / 상태색 17 / 직접 form 15 | 기준 화면. detail/editor 내부 잔여분을 0.21.31 이후 줄인다. |
| 발주 | `features/material-orders` | rounded 0 / 상태색 0 / 직접 form 0 | Foundation 적용 구간은 통과. 회귀 방지만 필요하다. |
| 저장소/첨부 | `components/admin/files`, Attachment modal | rounded 11 / 상태색 0 / 직접 form 0 | thumbnail, preview wrapper, modal shell 예외 여부 확인 필요. |
| 통계/멤버관리 | dashboard, members, admin common | rounded 34 / 상태색 36 / 직접 form 2 | chart dot, calendar range, table state 예외가 섞여 있다. |
| 설정/결제/회사 | settings, billing, companies | rounded 117 / 상태색 35 / 직접 form 2 | 아직 미확장. 별도 라운드 필요. |
| public/dev | public error, dev console | rounded 13 / 상태색 27 / 직접 form 3 | 고객 업무 화면이 아니므로 낮은 우선순위. |

## 예외 기준

허용 가능한 예외는 다음으로 제한한다.

- progress node, dot, spinner, avatar처럼 실제 원형 의미가 있는 요소
- chart dot, tooltip anchor, donut center 같은 시각화 primitive
- calendar range start/end/middle처럼 외부 캘린더 문법상 분리되는 요소
- grid, flex, gap, width, overflow처럼 layout-only class
- dev console, public error page처럼 고객 업무 화면이 아닌 낮은 우선순위 화면

## 다음 작업

0.21.31은 통계/멤버관리 direct style 잔여분을 줄인다.

우선순위는 다음 순서다.

1. `AdminDateRangePicker` calendar range 예외/제거 후보 분리
2. `AdminBasicStatsCharts` chart dot/tooltip/empty overlay 예외/제거 후보 분리
3. `WaflDataTable`, `WaflFilterBar`, member row의 남은 direct status color 제거
4. 직접 form class가 남은 경우 `WaflInput`, `AppSelect`, `WaflButton`으로 전환
