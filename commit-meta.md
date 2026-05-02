Version : 0.9.86
Base Version : 0.9.85
Target Version : 0.9.86
Summary : company user repository DB 조회 연결
Description : 시스템관리자 고객사 조회를 위한 company/user repository 타입과 DB repository를 추가하고, /api/system/companies route를 실제 DB 조회 handler로 연결했습니다. 고객사 목록, 고객사 상세, company_users, role_permissions 조회만 포함하며 생성/수정/삭제와 인증 연결은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/system/companies/route.ts
추가 파일 목록 :
- lib/companies/companyTypes.ts
- lib/companies/companyRepository.ts
- lib/companies/api/companyRouteHandlers.ts
- lib/companies/index.ts
- docs/companies/company_user_repository_db_connection.md
삭제 파일 목록 :
- 없음
