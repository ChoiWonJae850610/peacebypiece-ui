Version : 0.9.112
Base Version : 0.9.111
Target Version : 0.9.112
Summary : 권한 정책 export 빌드 에러 수정
Description : 0.9.111 적용 후 lib/permissions/permissionRepository.ts에서 import하는 resolvePermissions가 permissionPolicy.ts에 export되지 않아 발생한 Next.js build/runtime 에러를 수정했습니다. permissionPolicy.ts에 PermissionResolutionInput 타입과 resolvePermissions() export를 추가해 role permission과 explicit permission을 중복 제거 후 반환하도록 했으며 permission repository, API 응답 포맷, DB schema 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/permissions/permissionPolicy.ts
추가 파일 목록 :
- docs/system/system_permissions_export_fix.md
삭제 파일 목록 :
- 없음
