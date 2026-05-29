Version : 0.18.27
Summary : 관리자 태블릿 레이아웃 공통 기준 통일
Description : iPad와 Galaxy Tab을 같은 태블릿 레이아웃 기준으로 처리하도록 WorkspaceShell과 관리자 목록/패널 구조를 page scroll 중심으로 재정리했습니다. PC 전용 고정 패널과 table/grid 구조는 2xl 이상에서만 적용되도록 이동했습니다. DB/API/R2 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workspace/layout/WorkspaceShell.tsx
- components/admin/common/AdminPanelSection.tsx
- components/admin/common/adminSemanticClassNames.ts
- components/admin/common/AdminTable.tsx
- components/admin/common/AdminSegmentedTabs.tsx
- components/admin/common/AdminSummaryMetricCards.tsx
- components/admin/files/AdminFilesWorkspaceClient.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterFilters.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx
- components/admin/partnerMaster/PartnerMasterSummaryCards.tsx
- components/admin/members/AdminMemberDirectoryControls.tsx
- components/admin/members/AdminMemberDirectorySection.tsx
- components/admin/members/AdminMemberInvitationSection.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- docs/tablet-fluid-admin-layout-0.18.27.md
삭제 파일 목록 :
- 없음
