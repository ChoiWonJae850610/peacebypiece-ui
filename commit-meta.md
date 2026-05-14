Version :
0.11.89

Summary :
작업지시서 금액 요약 표시 기준 보정

Description :
작업지시서 발주정보 합계 영역에 총 금액 표시를 보강하고, 생산구성 요약 문구를 공통 helper로 정리해 PC, 태블릿, 모바일에서 원단/부자재와 외주공정 금액 합계가 같은 기준으로 표시되도록 수정했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/detail/detailFormatting.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletProductionCompositionSection.tsx

추가 파일 목록 :
- docs/workorder-cost-summary-regression-0.11.89.md

삭제 파일 목록 :
없음
