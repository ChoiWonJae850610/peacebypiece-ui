Version : 0.15.90
Summary : 작업지시서 진행 전 검증 모달 추가
Description : 검토요청/발주요청 전에 대표 디자인, 첨부파일, 원단, 부자재, 0원 금액 상태를 확인하는 validation modal을 추가했습니다. 대표 디자인 없음은 진행 차단 항목으로 표시하고, 첨부파일/원단/부자재/금액 0원은 경고 항목으로 표시해 사용자가 확인 후 계속 진행할 수 있게 했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/useWorkOrder.ts
- components/workorder/WorkOrderOverlay.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/workorder/workspace/viewModelTypes.ts
- lib/workorder/workspace/builders/modalBuilders.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts
추가 파일 목록 :
- lib/workorder/workflowValidationIssues.ts
- components/common/modal/WorkflowValidationModal.tsx
삭제 파일 목록 :
