Version :
0.9.224350

Summary :
작업지시서 상태 변경 최소 patch API 추가

Description :
검수 완료와 워크플로우 상태 변경이 전체 작업지시서 저장 경로를 타지 않도록 상태 변경 전용 patch API와 repository 경로를 추가했다. 상태 변경 저장은 workflowState, lastSavedAt, inventory 관련 값, factoryOrderRequest, orderEntries만 부분 갱신하도록 분리했다.

수정 파일 목록 :
- app/api/workorders/[workOrderId]/route.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/repositories/dbWorkorderRepository.ts
- lib/repositories/mockWorkorderAdapter.ts
- lib/repositories/mockWorkorderRepository.ts
- lib/repositories/workorderRepository.ts
- lib/repositories/workorderRepositoryAdapter.ts
- lib/repositories/workorderRepositoryCapabilities.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- types/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-state-patch-api-0.9.224350.md

삭제 파일 목록 :
없음
