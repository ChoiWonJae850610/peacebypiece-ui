Version :
0.12.11

Summary :
작업지시서 개별 모달 content semantic token 정리

Description :
작업지시서에서 사용하는 생성, 첨부 미리보기/삭제, 재고 수정, 담당자 변경, 권한, 발주 확인, 검수, 거래처/외주처 등록 모달 내부의 직접 색상 class를 semantic token 기반 class로 정리했다. 공통 모달 content class 파일을 추가해 field, readonly, muted, section, empty, warning panel 의미를 재사용하도록 했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/AttachmentDeleteConfirmModal.tsx
- components/common/modal/AttachmentPreviewModal.tsx
- components/common/modal/CreateWorkOrderModal.tsx
- components/common/modal/InventoryEditor.tsx
- components/common/modal/InventoryLogModal.tsx
- components/common/modal/ManagerAssignModal.tsx
- components/common/modal/OrderRequestConfirmModal.tsx
- components/common/modal/PermissionModal.tsx
- components/common/modal/WorkOrderDeleteConfirmModal.tsx
- components/common/modal/createWorkOrder/CreateWorkOrderCategoryFields.tsx
- components/common/modal/createWorkOrder/CreateWorkOrderRecommendationPanel.tsx
- components/workorder/PartnerFactoryRegistryModal.tsx
- components/workorder/detail/modals/OrderInspectionModal.tsx

추가 파일 목록 :
- components/common/modal/modalContentClassNames.ts

삭제 파일 목록 :
없음
