# 0.18.58 통계정보 분석 카드 소스 정리

## 변경 목적
통계정보 화면의 분석 영역 카드 렌더링 책임을 `AdminStatsDashboard`에서 분리했습니다.

## 반영 내용
- `PeriodSummaryCard`, `PeriodTopCard`, `AdminStatsBarListCard`를 `AdminStatsAnalysisCards`로 분리
- `AdminStatsDashboard`는 분석 섹션 상태, 데이터 계산, 화면 조합 중심으로 축소
- 기존 통계 탭, 그래프, 기간 선택, 테이블 흐름은 유지

## 변경하지 않은 것
- WorkspaceShell 스크롤 구조
- 통계 데이터 계산 로직
- DB/API 조회 흐름
- 그래프 색상/카드 스타일
