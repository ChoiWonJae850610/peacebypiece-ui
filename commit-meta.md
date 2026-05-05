Version :
0.9.191

Summary :
작업지시서 상태 전환 중 전역 쓰기 잠금 기준 적용

Description :
작업지시서 상태 전환 처리 중 새 작업지시서 생성, 새로고침, 첨부 업로드, 메모 등록/수정/삭제, 상세 inline edit 등 주요 쓰기 액션을 차단하도록 보완했다. 숨겨진 파일 input과 drag-and-drop 업로드도 함께 차단하고, 같은 전역 쓰기 잠금 기준을 다른 화면으로 확장하기 위한 문서를 추가했다.

수정 파일 목록 :
- components/layout/SidebarContent.tsx
- components/workorder/WorkOrderOverlay.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- lib/constants/app.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/builders/sidebarBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts

추가 파일 목록 :
- docs/workorder-global-write-lock-0.9.191.md

삭제 파일 목록 :
없음
