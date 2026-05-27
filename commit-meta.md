Version : 0.17.28
Summary : 작업지시서 발주 정보 용어와 계산식 정리
Description : 작업지시서 PC 상세의 발주 정보에서 발주 상태/발주 항목 설명과 생산 구성 설명 문구를 제거하고, 봉제/외주 용어를 제작/추가 공정으로 정리했습니다. 공정 추가 버튼 문구를 보정하고, 제작 행 금액 계산을 수량 × 단가 + 로스비 기준으로 표시하도록 공통 계산 함수를 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/detail/detailCalculations.ts
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
삭제 파일 목록 :
