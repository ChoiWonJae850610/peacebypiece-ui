# 0.10.72 저장소 용량 기준 중앙화

## 목표

`/admin/files`, `/admin/dashboard`, `/system/storage-usage`가 서로 다른 하드코딩 저장공간 한도를 사용하지 않도록 중앙 quota 정책을 추가했다.

## 추가 기준

- 중앙 파일: `lib/billing/storageQuotaPolicy.ts`
- 기본 quota: Starter plan의 `includedStorageBytes`
- 기본 fallback: `DEFAULT_ADMIN_STORAGE_QUOTA_BYTES`
- 표시 포맷: `formatStorageBytes()`
- 사용률 상태: `getStorageUsageStatus()`
- 고객사 파일 정책 기반 resolve: `resolveStorageQuotaFromCompanyFilePolicy()`
- 고객사 요금제 정책 기반 resolve: `resolveStorageQuotaFromCompanyPlanPolicy()`

## 반영 범위

### `/admin/files`

`app/api/admin/files/snapshot/route.ts`에서 직접 GB 계산을 하지 않고 중앙 quota policy를 사용한다.

- active file bytes
- trash file bytes
- includeTrashInUsage
- storageLimitGb
- warningThresholdPercent

위 값만 전달하고, 사용률/상태/표시 라벨은 `storageQuotaPolicy`에서 계산한다.

### `/admin/dashboard`, `/admin/dashboard` 통계

기존 `ADMIN_FILE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024` 하드코딩을 제거하고 `DEFAULT_ADMIN_STORAGE_QUOTA_BYTES`를 참조하게 했다.

### `/system/storage-usage`

시스템 저장소 purge 화면에도 동일한 기본 quota policy를 표시한다. 이 화면은 아직 고객사별 quota 사용률 화면이 아니라 R2 purge 후보 화면이므로, 현재는 중앙 기본 quota 기준을 정책 카드로만 노출한다.

## 의도적으로 하지 않은 것

- `company_plan_assignments` DB CRUD 연결 없음
- 고객사별 quota override 실제 조회 없음
- `/admin/files` quota를 system billing DB에서 직접 읽는 기능 없음
- R2 purge 로직 변경 없음
- 작업지시서/휴지통/첨부 삭제 흐름 변경 없음

## 다음 단계

0.10.73에서 시스템관리자가 고객사별 요금제와 저장공간 override를 수정하는 화면을 추가하면, 이번 중앙 policy에 실제 DB 값을 주입하면 된다.
