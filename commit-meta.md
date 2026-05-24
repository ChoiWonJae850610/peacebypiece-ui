Version : 0.16.29
Summary : 작업지시서 담당자 기준과 자재 권한 분리 보정
Description : 일반 멤버 작업지시서 목록 조회를 본인 담당자 기준으로 고정하고, 담당자 후보에 고객사 관리자를 포함합니다. 멤버 권한에 검수 가능, 원단·부자재 주문 가능, 원단·부자재 발주 가능 항목을 추가하고 자재 라인 API 권한을 주문/발주 권한으로 분리합니다.
수정 파일 목록 :
- app/api/workorders/material-lines/route.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- db/schema/full_reset.sql
- lib/admin/settings/userAccessRepository.ts
- lib/constants/app.ts
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
- lib/materials/capabilities.ts
- lib/permissions/memberPermissionMatrix.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
