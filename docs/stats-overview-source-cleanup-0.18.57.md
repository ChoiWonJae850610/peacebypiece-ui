# 0.18.57 통계정보 상단 지표 소스 정리

## 목적

통계정보 화면의 상단 누적 지표 영역을 별도 presentation component로 분리한다.

## 변경 범위

- `AdminStatsDashboard`에서 상단 `운영 누적 지표` 섹션 렌더링 책임 분리
- `AdminStatsOverviewSection` 추가
- 기존 `AdminSummaryMetricCards` 기반 요약 카드 사용 유지

## 유지한 사항

- 통계 데이터 계산 흐름 변경 없음
- 기간 선택 흐름 변경 없음
- 그래프/탭/분석 영역 변경 없음
- WorkspaceShell 변경 없음
- DB/API 흐름 변경 없음
