# full_reset.sql 실행 검증 가이드

Version: 0.9.74

## 목적

`db/schema/full_reset.sql`은 개발 DB를 완전히 초기화하는 기준 파일이다.  
0.9.73에서 고객사/사용자/권한/초대/요금제/용량 구조를 반영했으므로, 0.9.74에서는 실행 후 검증 절차를 분리한다.

## 실행 순서

개발 DB에서만 실행한다.

```sql
-- 1. 전체 초기화
\i db/schema/full_reset.sql

-- 2. smoke test
\i db/schema/full_reset_smoke_test.sql
```

Neon SQL Editor를 쓰는 경우에는 `full_reset.sql` 전체를 먼저 실행하고, 그 다음 `full_reset_smoke_test.sql` 전체를 실행한다.

## smoke test 확인 항목

`full_reset_smoke_test.sql`은 아래 항목을 확인한다.

1. 핵심 테이블 생성 여부
   - companies
   - users
   - company_users
   - role_catalog
   - permission_catalog
   - role_permissions
   - system_users
   - invitations
   - plans
   - company_plan_assignments
   - storage_usage_snapshots
   - spec_sheets
   - orders
   - attachments
   - memos
   - partners
   - material_orders

2. 핵심 view 생성 여부
   - expired_pending_invitations
   - latest_storage_usage_snapshots

3. seed 개수
   - role_catalog 최소 5개
   - permission_catalog 최소 14개
   - plans 최소 3개
   - system_permission_catalog 최소 6개
   - companies 최소 1개

4. FK 정합성
   - role_permissions orphan 없음
   - company_users orphan 없음
   - company_plan_assignments orphan 없음
   - storage_usage_snapshots orphan 없음

## 실패 시 판단

### Missing tables/views

`full_reset.sql`이 최신 파일이 아니거나 실행 중간에 실패한 상태다.  
가장 먼저 SQL Editor의 이전 에러를 확인한다.

### seed count too low

초기 seed가 누락된 상태다.  
`role_catalog`, `permission_catalog`, `plans`, `system_permission_catalog` insert 구간을 확인한다.

### orphan found

seed 순서 또는 FK 연결값이 잘못된 상태다.  
수동으로 일부 테이블만 삭제/재실행했을 때도 발생할 수 있다.

## 다음 작업 기준

0.9.75에서는 시스템관리자 콘솔 메뉴 링크를 연결한다.

대상 후보:
- `/system/invites`
- `/system/billing`
- `/api/system/stats`
- `/api/system/storage-usage`

실제 DB 연결은 아직 하지 않고, skeleton route로 이동 가능한 구조를 먼저 정리한다.
