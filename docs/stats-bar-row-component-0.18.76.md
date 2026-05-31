# 0.18.76 통계정보 bar row 컴포넌트 분리

## 목적

통계정보 분석 카드에서 반복 사용하는 막대형 row 렌더링을 별도 컴포넌트로 분리했습니다.

## 반영 내용

- `AdminStatsBarRow`를 `components/admin/dashboard/AdminStatsBarRow.tsx`로 분리
- compact/standard density 기준 유지
- 기존 기간 상위 목록과 bar list 카드의 표시 흐름 유지
- 통계 계산/탭 전환/기간 선택/적용 흐름 변경 없음

## 확인 포인트

- 생산 구성/업체 성과/기간 분석 탭 전환 유지
- 막대형 row 표시 유지
- 빈 데이터 표시 유지
