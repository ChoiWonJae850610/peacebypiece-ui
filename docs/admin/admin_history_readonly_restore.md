# 관리자 히스토리 화면 read-only 복원

Version: 0.9.99

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin/history`를 read-only 히스토리 화면으로 복원한다.

## 이번 패치 기준

1. `/admin/history` route를 `AdminHistoryReadOnlyPage`로 연결한다.
2. 서버에서 `listAdminHistoryEvents()`를 호출해 history log를 조회한다.
3. 기존 `AdminWorkOrderHistoryPage`, `AdminHistoryList`, `AdminWorkOrderHistoryItem`을 재사용한다.
4. 검색, 날짜 필터, 사용자 필터, 카테고리 필터는 client component에서 유지한다.
5. write action, audit log 신규 저장, DB schema 변경은 포함하지 않는다.
6. 기존 작업지시서, 첨부, 거래처, 파일 관리 흐름은 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/admin/history/page.tsx`
- `lib/admin/adminRegressionRoutes.ts`

## 추가 범위

- `components/admin/history/AdminHistoryReadOnlyPage.tsx`
- `docs/admin/admin_history_readonly_restore.md`

## 제외

- audit log DB 신규 설계
- history log write action 추가
- 기존 repository query 변경
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.100에서 `/admin/partners` 거래처/공장관리 화면 read-only 복원을 진행한다.
