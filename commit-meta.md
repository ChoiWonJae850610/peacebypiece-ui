Version :
0.13.29

Summary :
업체관리 회사 범위 기준과 빌드 타입 오류 수정

Description :
작업지시서 API의 세션 null 가능성 타입 오류를 수정했다. 업체관리와 작업지시서 거래처 옵션 API가 실제 로그인 세션의 companyId를 repository scope로 사용하도록 정리하고, 업체관리 mock repository fallback과 고정 회사 기준 쓰기를 제거했다. 업체 생성, 수정, 공정 설정, 거래처 목록 조회가 세션 회사 범위 안에서만 동작하도록 보강했다.

수정 파일 목록 :
- app/api/admin/partners/route.ts
- app/api/partners/factories/route.ts
- app/api/partners/workorder-options/route.ts
- lib/admin/dbIntegration.ts
- lib/admin/partner/dbMapper.ts
- lib/admin/partner/repository.ts
- lib/constants/app.ts
- lib/partners/dbPartnerRepository.ts
- lib/partners/partnerAdapter.ts
- lib/partners/partnerRepository.ts
- lib/partners/types.ts
- lib/workorder/api/workOrderRouteHandlers.ts

추가 파일 목록 :
- lib/partners/sessionScope.ts

삭제 파일 목록 :
- lib/partners/mockPartnerRepository.ts
- lib/repositories/mockPartnerRepository.ts
