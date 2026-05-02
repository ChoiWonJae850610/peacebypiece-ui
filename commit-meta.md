Version : 0.9.87
Base Version : 0.9.86
Target Version : 0.9.87
Summary : permission policy DB 권한 연결 준비
Description : DB의 permission_catalog, role_permissions, company_user_permissions를 읽어 권한 계산에 사용할 수 있는 permission 타입, policy, repository, system permissions API를 추가했습니다. 기존 작업지시서 workflow 권한 동작은 변경하지 않고 앱 버전을 0.9.87로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- app/api/system/permissions/route.ts
- lib/permissions/permissionTypes.ts
- lib/permissions/permissionPolicy.ts
- lib/permissions/permissionRepository.ts
- lib/permissions/api/permissionRouteHandlers.ts
- lib/permissions/index.ts
- docs/permissions/permission_policy_db_connection.md
삭제 파일 목록 :
- 없음
