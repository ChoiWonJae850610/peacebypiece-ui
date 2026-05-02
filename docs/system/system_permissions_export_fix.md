# 권한 정책 export 빌드 에러 수정

Version: 0.9.112

## 목적

0.9.111 적용 후 `/api/system/permissions` import trace에서 발생한 build/runtime error를 수정한다.

## 에러

`lib/permissions/permissionRepository.ts`가 `lib/permissions/permissionPolicy.ts`에서 `resolvePermissions`를 import하지만,
`permissionPolicy.ts`에 해당 export가 없어 Next.js build/runtime 에러가 발생했다.

## 수정 내용

1. `permissionPolicy.ts`에 `PermissionResolutionInput` 타입을 추가했다.
2. `resolvePermissions()` export를 추가했다.
3. role permission과 explicit permission을 중복 제거 후 정렬해서 반환하도록 했다.
4. 기존 `normalizePermissions`, `hasPermission`, `hasEveryPermission`, `hasSomePermission` 동작은 유지했다.
5. `permissionRepository`, permission API, DB schema는 수정하지 않았다.

## 제외

- permission repository 변경
- permission API 응답 포맷 변경
- role/permission DB schema 변경
- `/system/permissions` 화면 구조 변경
- package.json 변경

## 다음 작업

0.9.113에서 `/system/storage-usage` 저장공간 사용량 read-only 화면 추가를 진행한다.
