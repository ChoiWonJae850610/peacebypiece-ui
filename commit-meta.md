Version :
0.9.224345

Summary :
작업지시서 상세 lazy load 1차 구현

Description :
작업지시서 첫 진입 시 목록 전용 summary API를 먼저 사용하고 초기 선택 작업지시서와 이후 선택된 작업지시서만 상세 API로 hydrate하도록 전환했다. 상세 API와 repository detail 메서드를 추가하고 summary 상태의 첨부 개수 표시를 보정했다.

수정 파일 목록 :
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/repositories/dbWorkorderRepository.ts
- lib/repositories/mockWorkorderRepository.ts
- lib/repositories/workorderRepository.ts
- lib/repositories/workorderRepositoryAdapter.ts
- lib/repositories/workorderRepositoryCapabilities.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/workorder/mappers/workOrderListItemMapper.ts
- types/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/workorders/[workOrderId]/route.ts
- docs/workorder-detail-lazy-load-first-pass-0.9.224345.md

삭제 파일 목록 :
없음
