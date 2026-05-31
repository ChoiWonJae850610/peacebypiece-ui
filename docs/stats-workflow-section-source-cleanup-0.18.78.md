# 0.18.78 통계정보 workflow section 소스 정리

## 목적
통계정보 화면의 작업흐름분석 섹션에서 섹션 shell, 탭 영역, 애니메이션 wrapper 렌더링 책임을 `AdminStatsWorkflowSection`으로 분리합니다.

## 변경 범위
- `AdminStatsDashboard`는 데이터 계산과 각 탭 콘텐츠 조합 중심으로 유지합니다.
- `AdminStatsWorkflowSection`은 `AdminSection`, segmented tabs, active content animation shell을 담당합니다.

## 유지
- 통계 계산 로직 변경 없음
- 탭 전환 동작 변경 없음
- 기간 선택/적용 흐름 변경 없음
- WorkspaceShell 스크롤 구조 변경 없음
- DB/API 통계 조회 흐름 변경 없음
