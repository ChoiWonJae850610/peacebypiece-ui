Version : 0.15.90.1
Summary : 작업지시서 검증 모달 범위 및 반려 사유 보정
Description : 검토요청, 검토완료, 발주요청에만 진행 전 검증 모달을 적용하고 반려는 선택 사유 입력 모달로 분리했습니다. 반려 사유를 작업지시서 DB 필드에 저장하고 담당자 작성 화면에서만 안내되도록 반영했습니다.
수정 파일 목록 :
- components/workorder/WorkOrderOverlay.tsx
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/detail/workOrderDetailContainerModels.ts
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/detail/views/WorkOrderDetailMobileView.tsx
- components/workorder/detail/views/WorkOrderDetailTabletView.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/i18n/en/common.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/common.ts
- lib/i18n/ko/workorder.ts
- lib/workorder/actionFlow/workflowResults.ts
- lib/workorder/presentation/workOrderDetailPresentation.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/builders/modalBuilders.ts
- types/workorder.ts
추가 파일 목록 :
- components/common/modal/RejectReviewReasonModal.tsx
- components/workorder/detail/RejectionReasonNotice.tsx
- db/migrations/patch_0_15_90_1_workorder_rejection_reason.sql
삭제 파일 목록 :
