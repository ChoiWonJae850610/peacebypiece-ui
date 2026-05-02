# 환경설정 화면 read-only 복원

Version: 0.9.101

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin/settings`를 read-only 환경설정 화면으로 복원한다.

## 이번 패치 기준

1. `/admin/settings` route를 `AdminSettingsReadOnlyPage`로 연결한다.
2. 서버에서 `getCurrentAdminCompany()`, `getCompanySettings()`, `listCompanyUserAccessProfiles()`를 사용해 데이터를 조회한다.
3. DB 조회 실패 시 기본 company settings fallback을 표시한다.
4. 화면 설정, 파일 정책, 알림 정책, 사용자 접근 권한을 read-only로 표시한다.
5. 설정 저장, role 변경 modal, DB update action은 연결하지 않는다.
6. 기존 설정 repository, API, actionFlow, DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/admin/settings/page.tsx`
- `lib/admin/adminRegressionRoutes.ts`

## 추가 범위

- `components/admin/settings/AdminSettingsReadOnlyPage.tsx`
- `docs/admin/admin_settings_readonly_restore.md`

## 제외

- 설정 저장
- 권한 변경
- 사용자 초대/삭제
- settings DB schema 변경
- notification 정책 실제 발송 연결
- package.json 변경

## 다음 작업

0.9.102에서 `/admin/invites` 멤버 초대 UI 본 화면 재연결을 진행한다.
