Version : 0.13.3
Summary : admin 공통 카드·탭 UI와 멤버 초대 목록 스크롤 정리
Description : /admin/partners 기준 요약 카드 스타일과 /admin/members 기준 segmented tab 스타일을 공통 컴포넌트로 분리해 /admin/members, /admin/stats, /admin/partners에 적용했습니다. 멤버 초대 대기 목록은 카드 높이를 고정하고 테이블 영역 내부에서만 스크롤되도록 보정했습니다. 실제 SMS/email 발송, invitation token 검증, DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/common/adminSemanticClassNames.ts
- components/admin/partnerMaster/PartnerMasterSummaryCards.tsx
- components/admin/dashboard/AdminStatsDashboard.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- components/admin/common/AdminSummaryMetricCards.tsx
- components/admin/common/AdminSegmentedTabs.tsx
삭제 파일 목록 :
