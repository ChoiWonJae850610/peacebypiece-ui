# 0.18.75 통계정보 bar row 소스 정리

## 목적
통계정보 분석 카드 안에서 반복되던 막대형 row 렌더링을 공통 helper로 정리한다.

## 적용 범위
- `components/admin/dashboard/AdminStatsAnalysisCards.tsx`
- 기간 상위 5개 카드와 bar list 카드가 같은 `AdminStatsBarRow` 렌더링 기준을 사용하도록 정리했다.

## 유지 범위
- 통계 데이터 계산 변경 없음
- 탭 전환 변경 없음
- 기간 선택/적용 흐름 변경 없음
- DB/API 조회 흐름 변경 없음
- WorkspaceShell 구조 변경 없음
