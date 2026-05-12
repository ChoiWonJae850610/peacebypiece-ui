# PeaceByPiece 0.10.78 DB schema 잔여 파일 정리

## 목적

0.10.77에서 `full_reset.sql` 중심으로 reset 기준을 통합한 뒤 남아 있던 모듈형 schema 파일, 구버전 patch SQL, 데모 seed SQL, 구버전 설계 문서를 삭제 대상으로 확정한다.

## 최종 유지 파일

현재 reset 테스트 기준으로 유지할 DB 파일은 아래 3개다.

```text
db/schema/full_reset.sql
db/seed/system_standards_seed.sql
db/schema/full_reset_smoke_test.sql
```

## 삭제 확정 파일

```text
db/schema/materials.sql
db/schema/orders.sql
db/schema/outsourcing.sql
db/schema/spec_sheets.sql
db/schema/patch_0_9_43_admin_stats_events.sql
db/schema/seed_realistic_category_depth_0_9_22271.sql
db/schema/seed_realistic_workorders_0_9_2227.sql
db/schema/seed_realistic_workorders_usage_0_9_224341.md
db/schema/seed_stats_demo_0_9_2071.sql
db/schema/tenant_user_permission_design.md
```

## 삭제 판단

- `materials.sql`, `orders.sql`, `outsourcing.sql`, `spec_sheets.sql`는 현재 `full_reset.sql`에 통합된 모듈형 schema 조각이다. 별도 실행 파일로 남기면 reset 기준이 갈라지므로 제거한다.
- `patch_0_9_43_admin_stats_events.sql`은 현재 통계 구조가 summary table 중심으로 이동했고, full reset 기준 실행 흐름에 포함하지 않는다.
- `seed_realistic_*`, `seed_stats_demo_*`는 데모/통계 검증용 seed다. baseline reset에는 포함하지 않는다.
- `tenant_user_permission_design.md`는 0.9.x 시절 설계 문서이며 현재 0.10.52 이후의 permission_code 직접 부여 구조와 중복된다.

## reset 실행 순서

```powershell
psql $env:DATABASE_URL -f db/schema/full_reset.sql
psql $env:DATABASE_URL -f db/seed/system_standards_seed.sql
psql $env:DATABASE_URL -f db/schema/full_reset_smoke_test.sql
```

## 주의

이 패치는 삭제 목록을 commit-meta에 기록한다. 덮어쓰기 방식으로 patch를 적용하는 경우 삭제 파일은 사용자가 직접 제거해야 한다.
