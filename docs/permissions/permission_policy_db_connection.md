# permission policy와 DB 권한 연결 준비

Version: 0.9.87

## 목적

0.9.86에서 연결한 company/user repository 다음 단계로, DB의 role/permission 구조를 읽어 권한 계산에 사용할 준비를 한다.

## 추가 대상

- `lib/permissions/permissionTypes.ts`
- `lib/permissions/permissionPolicy.ts`
- `lib/permissions/permissionRepository.ts`
- `lib/permissions/api/permissionRouteHandlers.ts`
- `app/api/system/permissions/route.ts`

## API

### GET /api/system/permissions

- permission catalog
- role permissions

### GET /api/system/permissions?companyUserId=...

- company_user 기준 role permissions
- explicit permissions
- resolved permissions

## 이번 패치 기준

1. 기존 admin/designer/inspector 동작은 변경하지 않는다.
2. DB 권한을 읽는 구조만 추가한다.
3. 화면과 작업지시서 workflow에 바로 적용하지 않는다.
4. role_permissions가 비어 있을 때를 대비해 fallback role permissions를 유지한다.
5. company_user_permissions는 명시적 추가 권한으로만 합산한다.

## 다음 작업

0.9.88에서 작업지시서 company_id scope 점검을 진행한다.
