Version :
0.15.39

Summary :
작업지시서 종류와 첨부 범위 상수 기준 1차 정리

Description :
작업지시서 종류값과 첨부 범위값의 직접 문자열 사용을 줄이기 위해 workorderIdentity 상수를 추가했다. 리오더, 재작업, 첨부 업로드, 대표 디자인, 첨부 표시 조건 일부를 공통 상수와 normalize helper 기준으로 정리했다. DB schema, API 응답 포맷, R2 흐름, 권한, 세션 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/sidepanel/WorkOrderSidePanel.types.ts
- components/workorder/sidepanel/WorkOrderSidePanelContainer.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/permissions/attachments.ts
- lib/storage/r2/r2Keys.ts
- lib/workorder/actionFlow/attachmentResults.ts
- lib/workorder/actions.ts
- lib/workorder/attachments/attachmentBuilders.ts
- lib/workorder/attachments/attachmentMutations.ts
- lib/workorder/history/builders/attachmentHistoryBuilders.ts
- lib/workorder/history/builders/workHistoryBuilders.ts
- lib/workorder/persistence/attachmentMemoTypes.ts
- lib/workorder/persistence/workOrderAttachmentPolicy.ts
- lib/workorder/persistence/workOrderSavePolicy.ts
- lib/workorder/presentation/orderRequestDocumentPresentation.ts
- lib/workorder/presentation/workOrderPresentation.ts
- lib/workorder/presentation/workOrderWorkspacePresentation.ts
- lib/workorder/reorder/helpers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/workOrderDataRules.ts
- lib/workorder/workspace/viewModelTypes.ts
- types/workorder.ts

추가 파일 목록 :
- docs/wafl-a-type/62_wafl-a-type-workorder-kind-attachment-scope-constants.md
- lib/constants/workorderIdentity.ts

삭제 파일 목록 :
없음
