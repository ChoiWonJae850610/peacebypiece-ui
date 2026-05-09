# 0.9.22433 — 통계 i18n 잔여 정리

## 목표
관리자 통계 화면에서 한영 혼합 문구, 하드코딩 fallback, 임시 문구를 줄이고 한국어/영어 locale 문구를 자연스럽게 정리한다.

## 반영 내용
- `AdminStatsDashboard.tsx`의 기간 요약, 기간 TOP, 날짜 선택 fallback을 `pageText` 기반으로 정리했다.
- 수량 표시 함수의 기본 단위를 제거하고 호출부에서 i18n suffix를 전달하도록 유지했다.
- 한국어 통계 화면의 `Period analysis`, `Production mix`, `Delay / quality`, `TOP5` 계열 문구를 한국어 문구로 정리했다.
- 영어 통계 화면의 `TOP5` 표기를 `Top 5` 계열로 정리했다.
- 통계 view model의 aria label에서 `건` 하드코딩을 제거하고 `dashboardPage.workorderCountSuffix`를 사용하도록 수정했다.
- 기간 옵션의 custom fallback에서 `직접 선택` 하드코딩을 제거하고 `statsUi.periods.custom`을 사용하도록 수정했다.

## 보류 사항
- DB/selector에서 생성되는 일부 원천 label은 현재 한국어 기준 label을 UI에서 locale별로 변환하는 구조를 유지한다.
- 불량 수량 전용 기준은 0.9.22453에서 검수 데이터 구조 확정 후 다시 정리한다.

## 검증 권장
- `/admin/dashboard` 한국어/영어 전환
- 기간 요약 카드와 동적 TOP5 카드 문구
- 생산품 유형 비율 / 선택항목 품목 상위 5개 문구
- 업체 성과 / 업체별 납기·검수 지표 문구
- `npm run build`
