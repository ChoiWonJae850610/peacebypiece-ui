Version : 0.11.80
Summary : 발주정보 총 금액 요약 실제 표시 보정
Description : PC 작업지시서 발주정보 섹션이 직접 조립하던 요약 문자열을 공통 formatOrderSummary로 연결하여 제목 아래 요약 줄에 총 금액이 실제 표시되도록 보정했습니다. 0.11.79에서 추가한 수량 × 공임비 + 로스비 계산 기준을 화면 summary 경로에 반영했습니다.
수정 파일 목록 :
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-order-summary-total-display-0.11.80.md
삭제 파일 목록 :
