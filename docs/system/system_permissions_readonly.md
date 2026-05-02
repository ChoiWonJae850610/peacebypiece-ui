# 시스템 권한 관리 read-only 화면 추가

Version: 0.9.111

## 목적

`/system/permissions` 권한 관리 read-only 화면을 추가한다.

## 이번 패치 기준

1. `/system/permissions` route를 새로 추가한다.
2. `SystemPermissionsReadOnlyPage`를 추가한다.
3. 기존 `GET /api/system/permissions` API를 호출한다.
4. permission catalog와 role permission map을 read-only로 표시한다.
5. 검색과 카테고리 필터는 client state로만 처리한다.
6. 권한 부여, role 변경, permission 저장 action은 포함하지 않는다.
7. permission repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `lib/system/systemConsoleShell.ts`
- `lib/system/systemRegressionRoutes.ts`

## 추가 범위

- `app/system/permissions/page.tsx`
- `components/system/permissions/SystemPermissionsReadOnlyPage.tsx`
- `docs/system/system_permissions_readonly.md`

## 제외

- 권한 부여
- role 변경
- permission catalog 수정
- company user permission 수정
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.112에서 `/system/storage-usage` 저장공간 사용량 read-only 화면 추가를 진행한다.
