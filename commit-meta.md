Version : 0.18.25
Summary : 태블릿 가로 관리자 화면 레이아웃 재보정
Description : 저장소관리, 협력업체관리, 멤버관리의 태블릿 가로 화면이 PC 고정 패널 구조로 걸리지 않도록 주요 관리자 레이아웃의 고정/내부 스크롤 기준을 xl 이상으로 이동했습니다. 태블릿 가로는 페이지 전체 스크롤 중심으로 유지하고 DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workspace/layout/WorkspaceShell.tsx
- components/admin/common/AdminPanelSection.tsx
- components/admin/common/AdminTable.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterFilters.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx
- components/admin/members/AdminMemberDirectoryControls.tsx
- components/admin/members/AdminMemberDirectorySection.tsx
- components/admin/members/AdminMemberInvitationSection.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- docs/tablet-landscape-admin-reflow-0.18.25.md
삭제 파일 목록 :
