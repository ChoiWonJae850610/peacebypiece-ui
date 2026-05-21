Version : 0.15.62
Summary : 작업지시서 serviceCode 누락 액션 1차 연결
Description : 제목 변경, 담당자 변경, 즉시 저장 patch 경로에 serviceCode 전달 기준을 연결하고 full save/bulk save API 경로가 serviceCode를 수신할 수 있게 보강했습니다. 생산구성 replace 정책, DB schema, R2 동작은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/repositories/workorderRepository.ts
- lib/repositories/workorderRepositoryAdapter.ts
- lib/repositories/dbWorkorderRepository.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/hooks/workorder/useWorkOrderAdminActions.ts
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
추가 파일 목록 :
- lib/workorder/serviceCodeForWorkOrderPatch.ts
- docs/wafl-a-type/85_wafl-a-type-workorder-service-code-first-wire.md
삭제 파일 목록 :
- 없음
