# 고객관리자 콘솔 링크 점검

Version: 0.9.79

## 점검 대상

- `/admin`
- `/admin/invites`
- `/admin/partners`
- `/admin/files`
- `/admin/history`
- `/admin/settings`
- `/api/admin/stats?companyId=company-sample-customer`
- `/api/invitations?companyId=company-sample-customer`

## 이번 패치 기준

1. `app/admin/page.tsx`는 고객관리자 메뉴 허브 역할만 한다.
2. `/admin/invites`는 `CompanyMemberInviteSkeleton`만 반환한다.
3. API 경로는 code block으로 표시하고 화면에서 자동 호출하지 않는다.
4. 기존 작업지시서/거래처/저장소/히스토리/설정 링크는 유지한다.
5. 기존 AdminShell/dashboard 의존성은 이번 허브 화면에서 제거한다.

## 다음 점검

0.9.80에서 invitation API 타입과 route handler를 점검한다.
