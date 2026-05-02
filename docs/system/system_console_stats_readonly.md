# 시스템관리자 콘솔 통계 read-only 표시

Version: 0.9.106

## 목적

0.9.94에서 회귀 점검 화면으로 대체된 `/system` 홈을 시스템 통계 read-only 콘솔로 복원한다.

## 이번 패치 기준

1. `/system` route를 `SystemConsoleShell`로 다시 연결한다.
2. `SystemConsoleShell`을 회귀 점검 placeholder에서 read-only 통계 콘솔로 복원한다.
3. 기존 `GET /api/system/stats` API를 호출한다.
4. 전체 고객사 수, 활성 고객사 수, 전체 저장공간 사용량, 대기중 초대, ratio, series를 표시한다.
5. 시스템관리자 하위 화면과 API 진입점을 card로 제공한다.
6. 저장 action, 결제 자동화, audit log write는 포함하지 않는다.
7. stats repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `app/system/page.tsx`
- `components/system/SystemConsoleShell.tsx`
- `lib/system/systemConsoleShell.ts`

## 제외

- audit log write
- 결제 자동화
- 고객사 생성/수정
- 통계 chart library 추가
- package.json 변경
- DB schema 변경

## 다음 작업

0.9.107에서 고객관리자 통계 read-only 표시 또는 `/admin` 고객관리자 홈 본 화면 복원을 진행한다.
