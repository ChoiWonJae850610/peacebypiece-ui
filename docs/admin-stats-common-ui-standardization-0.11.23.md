# 0.11.23 관리자 통계 화면 공통 UI 적용

## 목적

관리자 통계 화면의 기간 선택 액션, 탭 전환 액션, empty state, 업체 성과 표를 관리자 공통 UI 컴포넌트 기준으로 정리한다.

## 반영 범위

- `/admin/dashboard` 통계 화면
- 기간 선택 달력의 초기화/완료 버튼
- 통계 섹션 탭 버튼
- 생산 구성 depth 전환 버튼
- 기간 분석 quick link / reset / apply 링크
- 업체별 납기/검수 지표 표
- Top list empty state

## 변경 내용

- 버튼형 액션을 `AdminButton`으로 전환했다.
- 링크형 액션을 `AdminLinkButton`으로 전환했다.
- 업체별 납기/검수 지표 표를 `AdminTable` 기준으로 전환했다.
- 업체 지표의 납기 지연율과 검수 이슈율을 `AdminStatusBadge`로 표시했다.
- 데이터가 없는 Top list 영역을 `AdminEmptyState`로 표시했다.

## 제외 범위

- 통계 API 변경 없음
- DB schema 변경 없음
- 통계 계산식 변경 없음
- Recharts 기반 차트 구조 변경 없음
- 날짜 선택 로직 변경 없음
