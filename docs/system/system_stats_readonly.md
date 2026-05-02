# 시스템 통계 상세 read-only 화면 추가

Version: 0.9.114

## 목적

`/system/stats` 시스템 통계 상세 read-only 화면을 추가한다.

## 이번 패치 기준

1. `/system/stats` route를 추가한다.
2. `SystemStatsReadOnlyPage`를 추가한다.
3. 기존 `GET /api/system/stats` API를 호출한다.
4. StatsSummary의 count, ratio, series를 상세 표시한다.
5. chart library 추가 없이 HTML/Tailwind 기반 bar 표현만 사용한다.
6. stats repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `lib/system/systemConsoleShell.ts`
- `lib/system/systemRegressionRoutes.ts`

## 추가 범위

- `app/system/stats/page.tsx`
- `components/system/stats/SystemStatsReadOnlyPage.tsx`
- `docs/system/system_stats_readonly.md`

## 제외

- chart library 추가
- 통계 계산식 변경
- stats repository 변경
- stats API 응답 포맷 변경
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.115에서 `/admin/stats` 고객관리자 통계 상세 화면 추가 여부를 판단하거나, 아직 남은 build/runtime 에러를 먼저 정리한다.
