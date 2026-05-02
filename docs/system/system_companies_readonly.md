# 시스템 고객사 관리 read-only 화면 추가

Version: 0.9.110

## 목적

`/system/companies` 고객사 관리 read-only 화면을 추가한다.

## 이번 패치 기준

1. `/system/companies` route를 새로 추가한다.
2. `SystemCompaniesReadOnlyPage`를 추가한다.
3. 기존 `GET /api/system/companies?includeInactive=true` API를 호출한다.
4. 고객사 목록, 활성/비활성 상태, 멤버 수, 저장공간 사용량을 read-only로 표시한다.
5. 검색과 상태 필터는 client state로만 처리한다.
6. 고객사 생성/수정/삭제 action은 포함하지 않는다.
7. company repository/API/DB schema는 수정하지 않는다.

## 수정 범위

- `lib/constants/app.ts`
- `lib/system/systemConsoleShell.ts`
- `lib/system/systemRegressionRoutes.ts`

## 추가 범위

- `app/system/companies/page.tsx`
- `components/system/companies/SystemCompaniesReadOnlyPage.tsx`
- `docs/system/system_companies_readonly.md`

## 제외

- 고객사 생성
- 고객사 수정
- 고객사 삭제
- plan assignment 변경
- storage override 변경
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.111에서 `/system/permissions` 권한 관리 read-only 화면 추가를 진행한다.
