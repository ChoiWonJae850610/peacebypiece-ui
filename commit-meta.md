Version : 0.16.31
Summary : 검수 권한 버튼 정책과 검토요청 중 발주 버튼 표시 보정
Description : 일반 멤버의 검수 가능 권한을 작업지시서 검토 승인/반려가 아닌 제품 검수 완료 권한으로 연결했습니다. 검수 완료 모달 표시 조건을 재고 수정 역할 기준에서 workorder.status.inspect 권한 기준으로 분리하고, 검수 완료 저장 시 inspection 단계에서 completed로 전환되는 변경은 검수 권한으로 검증되도록 보정했습니다. 또한 일반 멤버가 검토요청 상태에 들어간 작업지시서에서는 발주 권한이 있어도 발주요청 버튼이 표시되지 않도록 workflow action 정책을 정리했습니다.
수정 파일 목록 :
- components/workorder/detail/WorkOrderDetail.types.ts
- components/workorder/detail/WorkOrderDetailContainer.tsx
- components/workorder/detail/workOrderDetailContainerModels.ts
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/workorder/detail/workOrderDetailHelpers.ts
- lib/workorder/workflowPermissionPolicy.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/workspace/builders/detailBuilders.ts
추가 파일 목록 :
없음
삭제 파일 목록 :
없음
