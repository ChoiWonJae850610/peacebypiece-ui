Version : 0.11.70
Summary : 작업지시서 목록 필터와 정렬 1차 정리
Description : 작업지시서 업무 화면 기본 조회를 진행 중 상태 중심으로 정리하고, 완료건/전체/상태별 보기와 정렬값을 /worker query 및 summary API query 단계에 반영했습니다. 완료 작업지시서는 기본 조회에서 제외되어 목록 summary DB 조회량을 줄이고, 필요할 때 완료 또는 전체 필터로 다시 조회할 수 있게 했습니다.
수정 파일 목록 :
- app/api/workorders/summary/route.ts
- app/worker/page.tsx
- components/layout/SidebarContent.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/sidebarBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
추가 파일 목록 :
- lib/workorder/list/workOrderListControls.ts
- docs/qa-workorder-list-filter-sort-0.11.70.md
삭제 파일 목록 :
