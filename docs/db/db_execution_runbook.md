# DB 실행 Runbook

Version: 0.9.95

## 상황별 실행 파일

### 새 DB를 만들거나 개발 DB를 완전히 초기화할 때

실행:

```sql
\i db/schema/full_reset.sql
\i db/schema/full_reset_smoke_test.sql
```

판단:
- smoke test가 `full_reset smoke test passed`를 반환해야 한다.
- 실패하면 full_reset 또는 smoke test를 수정한다.

### 기존 DB를 업그레이드할 때

실행:

```sql
\i db/patches/patch_0.9.xx_description.sql
```

판단:
- 기존 데이터가 유지되어야 한다.
- destructive SQL은 별도 승인 없이는 실행하지 않는다.

## Neon SQL Editor 기준

1. 적용 대상 DB가 개발 DB인지 확인한다.
2. full reset인지 patch인지 먼저 구분한다.
3. SQL 전체를 붙여넣고 실행한다.
4. 에러가 있으면 중단한다.
5. 성공 후 관련 API route를 확인한다.

## 현재 추천 검증 경로

### full reset 후

- `db/schema/full_reset_smoke_test.sql`

### system API

- `/api/system/companies`
- `/api/system/permissions`
- `/api/system/billing`
- `/api/system/stats`
- `/api/system/storage-usage?companyId=company-sample-customer`

### admin API

- `/api/admin/stats?companyId=company-sample-customer`
- `/api/invitations?companyId=company-sample-customer`

## 금지

- 운영 DB에 full_reset 실행
- patch SQL에 실제 secret 포함
- schema 변경 없이 앱 코드만 DB 구조를 가정
- full_reset과 patch SQL 중 하나만 수정하고 나머지를 방치
