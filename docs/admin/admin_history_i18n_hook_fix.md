# 관리자 히스토리 i18n hook 의존성 제거

Version: 0.9.117

## 목적

0.9.116 기준 build/runtime 안정화 점검 중 `/admin/history`에서 발생할 수 있는 `useI18n must be used within I18nProvider` 계열 오류를 사전에 제거한다.

## 배경

`/admin/history`는 `AdminHistoryReadOnlyPage`에서 기존 `AdminWorkOrderHistoryPage`와 `AdminWorkOrderHistoryItem`을 재사용한다.  
이 하위 컴포넌트들은 `useI18n()` hook을 직접 호출하고 있어, route가 `I18nProvider` 밖에서 prerender/render될 경우 build/runtime 오류가 발생할 수 있다.

## 수정 내용

1. `AdminWorkOrderHistoryPage`에서 `useI18n()` 호출을 제거했다.
2. `AdminWorkOrderHistoryPage`는 `getI18n().admin` 기본 리소스를 사용한다.
3. `AdminWorkOrderHistoryItem`에서 `useI18n()` 호출을 제거했다.
4. `AdminWorkOrderHistoryItem`은 `buildAdminHistoryItemViewModel()`의 기본 i18n fallback을 사용한다.
5. history repository/API/DB schema는 수정하지 않았다.

## 수정 범위

- `lib/constants/app.ts`
- `components/admin/history/AdminWorkOrderHistoryPage.tsx`
- `components/admin/history/AdminWorkOrderHistoryItem.tsx`

## 제외

- history repository 변경
- history API 변경
- audit log write 설계
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.118에서는 실제 `npm run build` 결과를 기준으로 남은 build/runtime 에러를 계속 정리한다.
