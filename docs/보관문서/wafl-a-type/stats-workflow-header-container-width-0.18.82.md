# 0.18.82 통계정보 분석 통계 header container width 기준 보정

## 목적
- 통계정보 `분석 통계` header의 탭 위치가 갤럭시탭/아이패드 미니 등 기기별로 서로 다르게 보이는 문제를 줄인다.
- viewport breakpoint가 아니라 실제 header container 폭 기준으로 inline/stacked layout을 결정한다.

## 반영
- `AdminStatsWorkflowSection`에서 `useElementSize`로 header 실제 폭을 측정한다.
- 640px 이상에서는 제목/설명과 탭을 같은 row에 배치하고 탭을 상단 정렬한다.
- 640px 미만에서는 모바일/좁은 폭용 stacked layout을 유지한다.

## 유지
- 통계 계산 흐름 변경 없음
- 탭 전환 흐름 변경 없음
- 기간 선택/적용 흐름 변경 없음
- WorkspaceShell 스크롤 구조 변경 없음
- DB/API 통계 조회 흐름 변경 없음
