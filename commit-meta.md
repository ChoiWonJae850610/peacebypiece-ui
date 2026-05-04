Version :
0.9.156

Summary :
작업지시서 디자인·첨부 드래그 업로드 연결

Description :
디자인/첨부 패널의 점선 업로드 안내 영역에 실제 drag-and-drop 업로드를 연결했다. 기존 파일 선택 업로드와 동일한 업로드 처리 흐름을 재사용하며, R2 Worker 업로드·썸네일·삭제·메모 로직은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-attachment-dnd-0.9.156.md

삭제 파일 목록 :
없음
