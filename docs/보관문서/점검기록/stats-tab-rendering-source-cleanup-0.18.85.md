# 통계정보 탭 렌더링 소스 정리 0.18.85

## 목적

`AdminStatsDashboard`에 직접 포함되어 있던 통계정보 분석 탭별 렌더링 책임을 분리했다.

## 변경 범위

- 생산 구성 탭 렌더링을 `AdminStatsProductionSection`으로 분리
- 업체 성과 탭 렌더링을 `AdminStatsFactorySection`으로 분리
- 기간 분석 탭 렌더링을 `AdminStatsPeriodSection`으로 분리
- 기존 기간 상태/handler hook 흐름은 유지
- 통계 계산, DB 조회, API, R2, 첨부/메모/휴지통/purge 흐름은 변경하지 않음

## 기대 효과

- `AdminStatsDashboard`는 상태 조합과 탭 선택 흐름 중심으로 유지
- 탭별 JSX 밀도를 낮춰 후속 반응형 보정과 UI 눈검수 범위를 좁힘
- 0.18.86 반응형 최종 눈검수에서 탭별 수정 지점이 명확해짐
