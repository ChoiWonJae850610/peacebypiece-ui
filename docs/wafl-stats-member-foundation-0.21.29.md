# WAFL stats/member Foundation expansion 0.21.29

## Goal

통계와 멤버관리 화면의 summary card, filter, date picker, compact row, invitation form을 WAFL Foundation control 기준에 연결한다.
작업지시서에서 고정한 shape/density/tone 기준을 유지하고, 화면 내부의 직접 rounded/background/border 조합을 줄인다.

## Applied scope

- 통계 summary metric card를 `WaflSurface shape="control"` 계열로 정리
- 통계 기간 filter panel/date range trigger를 control shape 기준으로 정리
- 통계 chart tooltip/empty/list item의 직접 `rounded-2xl` 일부 제거
- 멤버관리 filter bar/search input/select를 WAFL control 기준으로 정리
- 멤버관리 compact list shell과 overflow action button을 WAFL 공통 컴포넌트 기준으로 정리
- 멤버 초대 compact form/policy box/expand button을 Foundation 기준으로 정리
- 멤버 권한 modal select trigger의 직접 radius를 `wafl-shape-control`로 교체

## Remaining exceptions

- chart dot, donut center, progress track은 실제 원형/진행 의미가 있어 예외로 둔다.
- system/admin operations dashboard의 운영 콘솔 계열 rounded 직접값은 별도 범위에서 정리한다.
