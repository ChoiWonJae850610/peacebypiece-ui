# 저장공간 사용량 read-only 화면 추가 및 관리자 거래처 빌드 에러 수정

Version: 0.9.113

## 목적

0.9.112 기준 build 중 `/admin/partners` prerender 단계에서 발생한 `useI18n must be used within I18nProvider` 에러를 수정하고, `/system/storage-usage` read-only 화면을 추가한다.

## 빌드 에러 수정

### 원인

`AdminPartnersReadOnlyPage`는 client component지만 `/admin/partners` prerender 과정에서 `useI18n()`을 호출한다.  
해당 route는 `I18nProvider` 하위에서 렌더링되지 않기 때문에 build/prerender 단계에서 에러가 발생했다.

### 조치

- `AdminPartnersReadOnlyPage`에서 `useI18n` import와 호출을 제거했다.
- `buildPartnerListViewModel()`에는 빈 type label map을 전달해 기존 `PARTNER_TYPE_META` fallback label을 사용하도록 했다.
- partner repository/API/DB 저장 흐름은 수정하지 않았다.

## 저장공간 사용량 화면 추가

1. `/system/storage-usage` route를 추가했다.
2. `SystemStorageUsageReadOnlyPage`를 추가했다.
3. 기존 `GET /api/system/storage-usage?companyId=...` API를 호출한다.
4. 고객사별 usedBytes, attachmentCount, measuredAt, source, note를 read-only로 표시한다.
5. R2 실시간 inventory 조회, snapshot 생성 action은 포함하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx`
- `lib/system/systemConsoleShell.ts`
- `lib/system/systemRegressionRoutes.ts`

## 추가 범위

- `app/system/storage-usage/page.tsx`
- `components/system/storageUsage/SystemStorageUsageReadOnlyPage.tsx`
- `docs/system/system_storage_usage_readonly_and_admin_partners_i18n_fix.md`

## 제외

- partner 저장 action
- partner API/DB 변경
- R2 실시간 inventory 조회
- storage snapshot 생성 action
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.114에서 `/system/stats` 시스템 통계 상세 read-only 화면 추가를 진행한다.
