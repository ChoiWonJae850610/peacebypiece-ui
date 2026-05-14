Version :
0.12.2

Summary :
작업지시서 잔여 semantic token 적용

Description :
작업지시서 기본정보 수정 모달, workflow action section, 비용 요약 카드, header/detail summary card에 semantic token 기반 class를 적용했다. 실제 테마 선택 UI나 동적 theme provider는 연결하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/workorder/detail/modals/BasicInfoEditModal.tsx
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/WorkOrderCostSummarySection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletCostSummarySection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileCostSummarySection.tsx
- components/workorder/detail/WorkOrderHeaderSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection.tsx

추가 파일 목록 :
- docs/workorder-remaining-semantic-token-0.12.2.md

삭제 파일 목록 :
없음
