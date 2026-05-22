Version : 0.15.76
Summary : 작업지시서 생성 목록 상세 hydration 흐름 정리
Description : 작업지시서 summary/detail/create snapshot 표시 기준을 공통 유틸로 분리하고, 상세 재조회 결과가 로컬 draft-only 입력값을 덮지 않도록 목록/상세 hydration 병합 정책을 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/hooks/workorder/workorderRepositoryMutations.ts
추가 파일 목록 :
- lib/workorder/workOrderHydration.ts
삭제 파일 목록 :
