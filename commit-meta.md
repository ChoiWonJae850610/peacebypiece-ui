Version :
0.13.34

Summary :
system/admin/customer 권한 경계와 시스템 API 보호 보강

Description :
시스템관리자 전용 API에 세션 role 검사를 추가하고, admin/worker 라우트 접근 기준에서 시스템관리자를 분리했다. 시스템 고객사 repository의 샘플 고객사 fallback을 제거하고 실제 DB companies/company_users 기준으로 조회·생성하도록 정리했다. 시스템 기준정보와 고객사 가입 승인/거절 감사 로그의 actor도 실제 시스템관리자 세션 사용자 기준으로 기록하도록 보강했다.

수정 파일 목록 :
- app/api/system/audit-logs/route.ts
- app/api/system/companies/join-requests/[requestId]/approve/route.ts
- app/api/system/companies/join-requests/[requestId]/reject/route.ts
- app/api/system/companies/route.ts
- app/api/system/standards/processes/route.ts
- app/api/system/standards/product-templates/route.ts
- app/api/system/standards/regression/route.ts
- app/api/system/standards/seed-status/route.ts
- app/api/system/standards/units/route.ts
- app/api/system/stats/route.ts
- app/api/system/storage-usage/purge/route.ts
- app/api/system/storage-usage/route.ts
- lib/auth/routeGuard.ts
- lib/company/api/companyRouteHandlers.ts
- lib/company/companyRepository.ts
- lib/constants/app.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/system/standards/api/processRouteHandlers.ts
- lib/system/standards/api/productTemplateRouteHandlers.ts
- lib/system/standards/api/unitRouteHandlers.ts

추가 파일 목록 :
- lib/system/sessionScope.ts

삭제 파일 목록 :
없음
