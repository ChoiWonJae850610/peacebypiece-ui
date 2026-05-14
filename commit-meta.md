Version : 0.11.79
Summary : 작업지시서 발주정보 총 금액 요약 표시
Description : 디자이너 담당 작업지시서 화면의 발주정보 요약 줄에 수량×공임비+로스비 기준 총 금액을 표시하도록 보정했습니다. 발주정보 총계 계산 helper에 totalCost를 추가하고, 공통 발주정보 summary formatter와 i18n 문구를 정리했습니다. DB/API/저장 구조는 변경하지 않았습니다.
수정 파일 목록 :
- lib/workorder/detail/detailCalculations.ts
- lib/workorder/detail/detailFormatting.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-order-summary-total-0.11.79.md
삭제 파일 목록 :
