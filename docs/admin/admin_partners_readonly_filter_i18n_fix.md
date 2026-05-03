# 관리자 거래처 read-only 필터 i18n 의존성 제거

Version: 0.9.116

## 목적

0.9.115 기준 build/runtime 안정화 점검 중 `/admin/partners`에서 다시 발생할 수 있는 i18n provider 의존성을 제거한다.

## 배경

0.9.113에서 `AdminPartnersReadOnlyPage`의 직접 `useI18n()` 호출은 제거했지만,
해당 화면은 여전히 `PartnerMasterFilters`를 렌더링하고 있었다.  
`PartnerMasterFilters` 내부에서도 `useI18n()`을 호출하므로 `/admin/partners` prerender/build 단계에서 같은 계열의 `useI18n must be used within I18nProvider` 오류가 재발할 수 있다.

## 수정 내용

1. `AdminPartnersReadOnlyPage`에서 `PartnerMasterFilters` import를 제거했다.
2. 같은 파일 내부에 `AdminPartnersReadOnlyFilters`를 추가했다.
3. 검색, 유형 필터, 상태 필터, 필터 카운트 표시를 read-only 화면 내부에서 직접 처리한다.
4. 기존 `buildPartnerListViewModel`, `togglePartnerFilterSelection`, partner API 호출 흐름은 유지한다.
5. partner 저장/수정/action, repository/API, DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `components/admin/partnerMaster/AdminPartnersReadOnlyPage.tsx`

## 제외

- partner 저장 action
- partner form/modal 복원
- 외주공정 저장
- partner repository/API 변경
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.117에서는 실제 `npm run build` 결과를 기준으로 남은 build/runtime 에러를 먼저 정리한다.
