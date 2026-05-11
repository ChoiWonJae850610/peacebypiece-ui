Version :
0.10.7

Summary :
멤버관리 1차 진입 화면 추가

Description :
고객관리자 카드형 홈의 멤버 관리 카드를 실제 /admin/members 화면으로 연결하고, 역할 기본값, 메인화면 카드 권한, 권한 그룹 기준을 확인할 수 있는 1차 placeholder 화면을 추가했다. 실제 멤버 초대, 권한 DB, 권한 편집 저장 기능은 후속 작업으로 유지했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/adminWorkspaceCards.ts
- components/admin/layout/AdminTopbar.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
- lib/admin/members/memberManagementPresentation.ts
- components/admin/members/AdminMemberManagementPlaceholder.tsx
- app/admin/members/page.tsx
- docs/member-management-placeholder-0.10.7.md

삭제 파일 목록 :
없음
