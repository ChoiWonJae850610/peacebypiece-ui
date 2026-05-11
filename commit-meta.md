Version :
0.10.60

Summary :
권한 기반 관리자 카드와 멤버관리 액션 제한 1차 구조 추가

Description :
관리자 운영 대시보드 카드 노출을 permission_code 기준 필터 구조로 통과시키고, 멤버관리 화면의 카드/승인 액션에 필요한 권한 표시를 추가했다. 실제 세션과 API 권한 검증은 후속 단계로 분리했다.

수정 파일 목록 :
- components/admin/dashboard/AdminConsoleSections.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/adminWorkspaceCards.ts
- lib/admin/members/memberManagementPresentation.ts
- lib/permissions/index.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/permissions/permissionAccess.ts
- docs/permission-based-admin-access-0.10.60.md

삭제 파일 목록 :
없음
