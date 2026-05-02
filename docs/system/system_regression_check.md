# 시스템관리자 화면 회귀 점검

Version: 0.9.94

## 목적

최근 `/system` 하위 route에서 GitHub raw 기준 깨진 JSX가 반복 확인되어, 시스템관리자 화면의 build/runtime 차단을 막는 안정화 허브를 적용한다.

## 확인된 문제

GitHub raw 기준 아래 파일들이 `return ;`, `return ( );`, 또는 JSX가 마크다운처럼 손상된 형태로 조회된다.

- `app/system/page.tsx`
- `app/system/invites/page.tsx`
- `app/system/billing/page.tsx`
- `app/system/category-rules/page.tsx`
- `components/system/SystemConsoleShell.tsx`
- `components/system/invitations/SystemCustomerInviteSkeleton.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `lib/system/systemConsoleShell.ts`

## 이번 패치 기준

1. `/system` 하위 route가 깨진 JSX로 build/runtime을 막지 않도록 안정화한다.
2. 정상 동작 중인 API와 DB repository는 수정하지 않는다.
3. 기능성 하위 컴포넌트를 무리하게 재연결하지 않는다.
4. route별 안전한 회귀 점검 화면을 먼저 제공한다.
5. 각 기능의 본 화면 복원은 별도 버전에서 하위 컴포넌트 단위로 진행한다.

## 안정화 route

- `/system`
- `/system/invites`
- `/system/billing`
- `/system/category-rules`

## 유지 API

- `/api/system/companies`
- `/api/system/permissions`
- `/api/system/billing`
- `/api/system/stats`
- `/api/system/storage-usage?companyId=company-sample-customer`
- `/api/invitations?companyId=company-sample-customer`

## 후속 권장 작업

0.9.95에서 full_reset.sql과 patch SQL 정합성 문서화를 진행한다.

그 다음 시스템관리자 기능 복원은 아래 순서가 적절하다.

1. category rules 하위 컴포넌트 복원
2. 고객 초대 UI 본 화면 재연결
3. 요금제·용량 UI 본 화면 재연결
4. 시스템 통계 화면 차트 연결
5. 시스템 audit log 화면 추가
