# full_reset.sql / patch SQL 정합성 매트릭스

Version: 0.9.95

## 목적

기능 개발 중 DB 구조가 추가될 때 `full_reset.sql`만 수정하고 patch SQL을 빠뜨리거나, 반대로 patch SQL만 만들고 full_reset 기준을 놓치는 일을 방지한다.

## 정합성 원칙

| 변경 유형 | full_reset.sql | patch SQL | smoke test |
|---|---:|---:|---:|
| 신규 테이블 추가 | 필요 | 필요 | 필요 |
| 신규 컬럼 추가 | 필요 | 필요 | 경우에 따라 필요 |
| 신규 index 추가 | 필요 | 필요 | 선택 |
| 신규 view 추가 | 필요 | 필요 | 필요 |
| seed 추가 | 필요 | 필요 | 필요 |
| 기존 컬럼 rename | 필요 | 필요 | 필요 |
| 기존 컬럼 삭제 | 필요 | 위험 검토 | 필요 |
| 데이터 backfill | 선택 | 필요 | 선택 |
| 개발 전용 검증 SQL | 불필요 | 불필요 | 별도 파일 |

## 현재 기준 주요 구조

### SaaS / tenant

- companies
- users
- company_users
- role_catalog
- permission_catalog
- role_permissions
- company_user_permissions
- system_users
- system_permission_catalog
- system_user_permissions

### invitations

- invitations
- expired_pending_invitations view

### billing / storage

- plans
- company_plan_assignments
- storage_usage_snapshots
- latest_storage_usage_snapshots view

### workorder / production

- spec_sheets
- orders
- attachments
- memos
- partners
- partner_items
- spec_sheet_materials
- spec_sheet_outsourcing_lines
- material_stocks
- material_orders
- material_order_lines
- material_allocations

## smoke test 필수 확인 항목

`full_reset_smoke_test.sql`은 최소한 아래를 확인해야 한다.

1. 핵심 테이블 존재
2. 핵심 view 존재
3. role/permission/plan/company seed 존재
4. FK orphan 없음
5. invitation / billing / storage 구조 존재

## patch SQL 작성 체크리스트

patch 파일을 만들 때 아래 항목을 확인한다.

```text
[ ] full_reset.sql에도 같은 최종 구조가 반영되어 있는가
[ ] 기존 데이터가 있는 DB에서 안전하게 실행 가능한가
[ ] IF NOT EXISTS 또는 guard가 있는가
[ ] seed 중복 insert 방지가 있는가
[ ] view 재생성 순서가 안전한가
[ ] rollback이 필요한 위험 변경인가
[ ] smoke test 보강이 필요한가
```

## 적용 순서

1. 기능 코드에서 필요한 DB 구조 확정
2. full_reset 최종 구조 반영
3. patch SQL 작성
4. smoke test 보강
5. 개발 DB에서 patch SQL 테스트
6. 새 DB에서 full_reset + smoke test 테스트
