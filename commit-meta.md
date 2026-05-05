Version :
0.9.190

Summary :
작업지시서 상태 전환 처리 중 표시를 보완

Description :
검토요청, 검토완료, 반려 등 작업지시서 상태 전환 버튼을 누르면 처리 중 문구와 spinner를 표시하고 중복 클릭을 방지하도록 보완했다. 발주요청 확인 모달의 최종 진행 버튼에도 발주요청 처리 중 상태를 표시했다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- components/workorder/detail/workOrderDetailContainerModels.ts
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/detailBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
