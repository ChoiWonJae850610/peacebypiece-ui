Version :
0.9.196

Summary :
작업지시서 PC 화면 간격과 카드 톤 정리

Description :
작업지시서 PC 화면의 좌측, 상세, 우측 패널 간격과 카드 톤을 정리했다. 상세 상단 영역을 카드화하고 발주정보, 생산구성, 비용요약, 우측 첨부/메모 카드의 radius, border, padding 기준을 맞췄다. 기능 동작과 DB/R2 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/common/ui/SummaryCard.tsx
- components/common/ui/WorkOrderPanelCard.tsx
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/layout/DesktopWorkspaceLayout.tsx
- components/workorder/sidepanel/layout/SidePanelSectionStack.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
