# 거래처/공장관리 화면 read-only 복원

Version: 0.9.100

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin/partners`를 read-only 거래처/공장관리 화면으로 복원한다.

## 이번 패치 기준

1. `/admin/partners` route를 `AdminPartnersReadOnlyPage`로 연결한다.
2. 기존 `GET /api/admin/partners`를 사용한다.
3. 기존 `buildPartnerListViewModel`, `PartnerMasterFilters`, partner presentation helper를 재사용한다.
4. 업체 목록, 담당자, 연락처, 이메일, 유형/외주공정, 상태, 수정일을 read-only로 표시한다.
5. 생성, 수정, 저장, 외주공정 관리 modal은 연결하지 않는다.
6. 기존 partner save API, DB repository, workorder partner option 흐름은 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/admin/partners/page.tsx`
- `lib/admin/adminRegressionRoutes.ts`

## 추가 범위

- `components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx`
- `docs/admin/admin_partners_readonly_restore.md`

## 제외

- 거래처 생성
- 거래처 수정
- 외주공정 저장
- partner schema 변경
- workorder partner/factory option 변경
- package.json 변경

## 다음 작업

0.9.101에서 `/admin/settings` 환경설정 화면 read-only 복원을 진행한다.
