Version :
0.13.28

Summary :
작업지시서 회사 범위 기준과 담당자 fallback 제거

Description :
작업지시서 조회, 생성, 저장, 상태변경, 삭제 API가 실제 로그인 세션의 companyId 없이는 동작하지 않도록 보강했다. 작업지시서 DB 저장소와 클라이언트 어댑터의 mock, seed, localStorage fallback을 제거하고, 담당자 후보 조회는 승인된 같은 회사 멤버만 반환하도록 정리했다. 작업지시서 하위 발주, 원부자재, 외주 동기화도 세션 companyId를 사용하도록 보정했다.

수정 파일 목록 :
- app/api/admin/settings/users/route.ts
- lib/admin/settings/userAccessPresentation.ts
- lib/admin/settings/userAccessRepository.ts
- lib/constants/app.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/repositories/dbWorkorderRepository.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/repository/dbFactoryOrderRepository.ts
- lib/workorder/repository/dbSpecSheetMaterialRepository.ts
- lib/workorder/repository/dbSpecSheetOutsourcingRepository.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
