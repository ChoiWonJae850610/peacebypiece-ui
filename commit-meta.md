Version : 0.18.24
Summary : 태블릿 관리자 화면 스크롤 구조 재보정
Description : 저장소관리, 협력업체관리, 멤버관리의 태블릿 가로/세로 화면에서 내부 스크롤과 터치 스크롤 지점이 충돌하지 않도록 AdminTable/AdminPanelSection/WorkspaceShell의 태블릿 구간 overflow 기준을 재보정했습니다. PC 고정 패널 동작은 lg 이상에서 유지하고 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workspace/layout/WorkspaceShell.tsx
- components/admin/common/AdminPanelSection.tsx
- components/admin/common/adminSemanticClassNames.ts
- components/admin/common/AdminTable.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/members/AdminMemberDirectorySection.tsx
- components/admin/members/AdminMemberInvitationSection.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx
추가 파일 목록 :
- docs/tablet-admin-responsive-reflow-0.18.24.md
삭제 파일 목록 :
- 없음
