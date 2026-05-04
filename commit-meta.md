Version :
0.9.157

Summary :
작업지시서 드래그 업로드 런타임 에러 보완

Description :
디자인/첨부 drag-and-drop 업로드 시 side panel 경로에서 onUploadAttachmentFiles handler가 전달되지 않아 발생하던 런타임 에러를 보완했다. desktop, tablet, mobile attachment section에 handler 전달을 명시하고 handler 누락 시 화면이 중단되지 않도록 방어 처리했다. 기존 파일 선택 업로드, R2 Worker 업로드, 썸네일, 삭제, 메모 저장 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelTabletView.tsx
- components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-attachment-dnd-runtime-fix-0.9.157.md

삭제 파일 목록 :
없음
