Version :
0.11.44

Summary :
작업지시서 모바일 화면 표시 보정 1차

Description :
작업지시서 모바일 레이아웃의 외곽 여백, 상세 카드, 기본 정보, workflow 액션, 발주정보 카드, 메모/첨부 accordion, 목록 카드의 좁은 폭 표시를 보정했다. 저장 정책, workflow 상태 변경, 첨부/R2, 메모 로직은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/layout/MobileSectionStack.tsx
- components/workorder/detail/views/WorkOrderDetailMobileView.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAccordionSection.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/responsive-workorder-mobile-0.11.44.md

삭제 파일 목록 :
없음
