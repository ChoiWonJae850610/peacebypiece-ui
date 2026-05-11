# 0.10.61 API 권한 검증 1차

## 목적

프론트 카드/버튼 숨김과 별개로 API route에서 `permission_code` 기준 검증을 적용할 수 있는 공통 구조를 추가한다.

이번 버전은 실제 OAuth session과 DB 기반 권한 조회가 연결되기 전 단계다. 따라서 기본 context는 `company_admin` role template의 permission list를 preview 권한으로 사용한다. 후속 버전에서 session user → company_member → member_permissions 조회로 교체한다.

## 추가 기준

- 공통 유틸: `lib/permissions/apiPermissionGuard.ts`
- export 연결: `lib/permissions/index.ts`
- 기본 동작:
  - `x-peacebypiece-permissions` header가 있으면 해당 permission list를 preview context로 사용
  - header가 없으면 `company_admin` role template permission list 사용
  - 요구 permission이 없으면 `403 API_PERMISSION_REQUIRED` 응답
- header는 개발/회귀 테스트용이며 실제 운영 권한 인증 수단이 아니다.

## 1차 적용 API

### 작업지시서

- `POST /api/workorders` → `workorder.create`
- `PATCH /api/workorders` → `workorder.update`
- `DELETE /api/workorders` → `workorder.delete`
- `PATCH /api/workorders/[workOrderId]` → `workorder.update`

### 첨부/휴지통

- `POST /api/workorders/attachments/delete` → `storage.delete.request`
- `POST /api/admin/files/trash/restore` → `storage.restore`
- `POST /api/admin/files/trash/purge` → `storage.delete.request`
- `POST /api/admin/files/workorders/restore` → `workorder.restore`
- `POST /api/admin/files/workorders/purge` → `storage.delete.request`

### 협력업체/기준정보

- `POST /api/admin/partners` → `partner.manage`
- `PATCH /api/admin/partners` → `partner.manage`
- `PUT /api/admin/partners` → `partner.manage`
- `PUT /api/admin/standards` → `standards.manage`

## 후속 작업

0.10.62 이후 실제 session 기반으로 연결할 때는 다음 순서로 교체한다.

1. Google OAuth session에서 user id/email 확인
2. `users` 조회
3. active company context 확인
4. `company_members.status = approved` 확인
5. `member_permissions.permission_code` 조회
6. `requireApiPermission`의 preview resolver를 DB resolver로 교체
7. 실패 응답은 `403 API_PERMISSION_REQUIRED` 형식 유지

## 주의

- 이번 버전은 실제 로그인/세션 연결이 아니다.
- API route에서 permission check 위치만 먼저 표준화한다.
- 기존 작업지시서/저장소/휴지통/R2 purge 도메인 로직은 변경하지 않는다.
