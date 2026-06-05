# WAFL 휴지통 action 위치와 통계 새로고침 제거 — 0.19.32

## 목적

0.19.31에서 저장소 휴지통 섹션의 divider 아래 간격까지 줄어든 부분을 되돌리고, 실제 요구사항인 action 버튼 묶음의 세로 위치만 설명문 라인으로 이동한다.

통계정보 화면은 메뉴 진입 시점의 데이터와 기간 분석 흐름을 기준으로 사용하므로, 분석 섹션 우측의 수동 새로고침 버튼을 제거한다.

## 적용 기준

- `WaflSectionPanel`에 `descriptionActions` slot을 추가한다.
- description 라인 우측에 action group을 배치할 수 있게 하되, 기존 `actions` slot은 그대로 유지한다.
- 휴지통 섹션은 divider와 table 사이 간격을 공통 기본값으로 복귀한다.
- 통계정보 화면의 새로고침 버튼, router refresh, 새로고침 toast 코드는 제거한다.

## 유지 사항

- 저장소 refresh 기능 자체는 `FileTrashSection`에서 유지한다.
- 저장소 action 버튼 기능은 변경하지 않는다.
- 통계 계산식과 탭 전환 로직은 변경하지 않는다.
- 모든 UI는 WAFL theme token 기반 공통 컴포넌트 기준을 유지한다.
