# 고객관리자 통계 상세 read-only 화면 추가

Version: 0.9.115

## 목적

`/admin/stats` 고객관리자 통계 상세 read-only 화면을 추가한다.

## 이번 패치 기준

1. `/admin/stats` route를 추가한다.
2. `AdminStatsReadOnlyPage`를 추가한다.
3. 기존 `GET /api/admin/stats?companyId=...` API를 호출한다.
4. StatsSummary의 count, ratio, series를 고객사 기준으로 상세 표시한다.
5. 상태별 작업지시서 count를 별도 영역으로 분리한다.
6. chart library 추가 없이 HTML/Tailwind 기반 bar 표현만 사용한다.
7. stats repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `lib/admin/adminConsoleShell.ts`

## 추가 범위

- `app/admin/stats/page.tsx`
- `components/admin/stats/AdminStatsReadOnlyPage.tsx`
- `docs/admin/admin_stats_readonly.md`

## 제외

- chart library 추가
- 통계 계산식 변경
- stats repository 변경
- stats API 응답 포맷 변경
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.116에서 남은 build/runtime 에러를 먼저 확인하거나, 관리자 files action 복원 검토를 진행한다.
