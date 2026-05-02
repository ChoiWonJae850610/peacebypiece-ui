# 시스템관리자 콘솔 링크 점검

Version: 0.9.78

## 점검 대상

- `/system`
- `/system/invites`
- `/system/billing`
- `/system/category-rules`
- `/api/system/companies`
- `/api/system/stats`
- `/api/system/storage-usage?companyId=company-sample-customer`

## 이번 패치 기준

1. `app/system/page.tsx`는 `SystemConsoleShell`만 반환한다.
2. `app/system/invites/page.tsx`는 `SystemCustomerInviteSkeleton`만 반환한다.
3. `app/system/billing/page.tsx`는 `SystemCompanyPlanSkeleton`만 반환한다.
4. API 경로는 링크로 호출하지 않고 code block으로 표시한다.
5. 기존 스토리지 정리 버튼은 유지한다.
6. 외부 dependency 추가 없이 동작해야 한다.

## 다음 점검

0.9.79에서 고객관리자 콘솔 링크와 `/admin` 하위 route를 같은 방식으로 점검한다.
