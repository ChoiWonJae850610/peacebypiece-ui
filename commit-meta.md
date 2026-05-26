Version : 0.17.17
Summary : 작업지시서 자재 발주 대기 상태 흐름 보정
Description : 작업지시서 발주요청 시 필요 원단·부자재가 있으면 검수 단계와 PDF 생성으로 바로 넘어가지 않고 material_order_pending 내부 상태에 머물도록 보정했습니다. material_order_pending은 화면상 기존 발주요청 단계로 표시하고, 원단·부자재 화면 후보 조회 기준을 해당 상태로 정리했습니다. 작업지시서 필요 자재에서 발주 품목을 추가할 때 단위·수량·단가가 함께 넘어가도록 보강했습니다.
수정 파일 목록 :
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- features/material-orders/MaterialOrderAllocationPanel.tsx
- features/material-orders/MaterialOrderDraftEditor.tsx
- lib/constants/app.ts
- lib/constants/workorderServiceCodes.ts
- lib/constants/workorderStates.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/material-orders/materialOrderReadiness.ts
- lib/workorder/actions.ts
- lib/workorder/list/workOrderListControls.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/presentation/workOrderListSemanticPresentation.ts
- lib/workorder/productionCompositionPolicy.ts
- lib/workorder/repository/dbWorkOrderRowMappers.ts
- lib/workorder/repository/dbWorkOrderSelectSql.ts
- lib/workorder/workflowPolicy.ts
- types/workorder.ts
추가 파일 목록 :
- lib/workorder/materialOrderReadiness.ts
- docs/현재기준/0.17.17-material-order-pending-flow.md
삭제 파일 목록 :
없음
