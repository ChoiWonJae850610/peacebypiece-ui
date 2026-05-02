Version : 0.9.77
Base Version : 0.9.76
Target Version : 0.9.77
Summary : 콘솔 및 초대 화면 TSX 무결성 복구
Description : GitHub master에서 확인된 app/admin/page.tsx, app/system/page.tsx, system/admin invite page, billing page, 주요 skeleton 컴포넌트의 깨진 return/JSX 손상 파일을 정상 TSX 구조로 복구하고 앱 버전을 0.9.77로 갱신했습니다. package.json, package-lock.json, .env.local은 수정하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/admin/page.tsx
- app/system/page.tsx
- app/admin/invites/page.tsx
- app/system/invites/page.tsx
- app/system/billing/page.tsx
- lib/admin/adminConsoleLinks.ts
- lib/system/systemConsoleShell.ts
- components/system/SystemConsoleShell.tsx
- components/invitations/InvitationQrPreview.tsx
- components/admin/invitations/CompanyMemberInviteSkeleton.tsx
- components/system/invitations/SystemCustomerInviteSkeleton.tsx
- components/system/billing/SystemCompanyPlanSkeleton.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
