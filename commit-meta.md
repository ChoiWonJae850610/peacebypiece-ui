Version : 0.18.23
Summary : 일반멤버 약관 정책 카드와 태블릿 관리자 화면 스크롤 보정
Description : 일반멤버 업무 홈에 약관·정책 조회 카드를 추가하고 /workspace/legal 조회용 정책 허브를 추가했습니다. WorkspaceShell fixed-md 기준을 lg 이상으로 조정해 태블릿 저장소관리·협력업체관리·멤버관리 화면에서 전체 페이지 스크롤이 막히는 문제를 줄였습니다. DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/adminWorkspaceCards.ts
- components/admin/dashboard/AdminConsoleSections.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- components/workspace/layout/WorkspaceShell.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
- components/admin/PartnerMasterSection.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- app/(workspace)/workspace/legal/page.tsx
- docs/workspace-tablet-responsive-0.18.23.md
삭제 파일 목록 :
