Version : 0.15.96
Summary : 발주서 PDF 재생성 버튼 및 실패 원인 구분 보정
Description : 발주요청 이후 발주서 PDF가 생성되지 않은 작업지시서의 첨부파일 영역에서 PDF 생성을 다시 실행할 수 있도록 버튼을 추가하고, PDF 생성/업로드/첨부 등록 실패 단계를 API 응답과 toast에서 구분하도록 보정했습니다.
수정 파일 목록 :
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelTabletView.tsx
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/workorder/generatedDocuments.ts
- lib/workorder/presentation/workOrderWorkspacePresentation.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
