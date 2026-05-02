# 고객관리자 콘솔 통계 read-only 표시

Version: 0.9.107

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin` 홈을 고객관리자 통계 read-only 콘솔로 복원한다.

## 이번 패치 기준

1. `/admin` route를 `AdminConsoleShell`로 다시 연결한다.
2. `AdminConsoleShell`을 새로 추가해 고객관리자 통계와 메뉴 진입점을 표시한다.
3. 기존 `GET /api/admin/stats?companyId=...` API를 호출한다.
4. 작업지시서 수, 첨부파일 수, 저장공간 사용량, 완료율, 상태별 수, 월별 series를 표시한다.
5. 고객관리자 하위 화면과 API 진입점을 card로 제공한다.
6. 저장 action, chart library, DB schema 변경은 포함하지 않는다.
7. stats repository/API는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/admin/page.tsx`

## 추가 범위

- `components/admin/AdminConsoleShell.tsx`
- `lib/admin/adminConsoleShell.ts`
- `docs/admin/admin_console_stats_readonly.md`

## 제외

- 거래처 저장 action
- 파일 삭제/복구 action
- 설정 저장 action
- 통계 chart library 추가
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.108에서 `/invite/[token]` 초대 수락 화면 API 연결을 진행한다.
