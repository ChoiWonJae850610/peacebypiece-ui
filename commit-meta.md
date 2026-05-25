Version : 0.16.44
Summary : 작업지시서 관리 권한과 발주 권한 분리 보정
Description : 작업지시서 관리 체크가 일부 권한 누락으로 꺼져 보이던 부분을 부분 권한 보유 시 활성 상태로 표시하도록 보정하고, 작업지시서 기본정보/제목 편집과 검토요청 표시를 역할 기반이 아닌 실제 권한 기반으로 제한했습니다. 발주 가능 권한은 발주요청에만 적용되도록 검토요청 정책을 workorder.update + workorder.status.review 기준으로 분리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/workflowPolicy.ts
- lib/workorder/selectors.ts
- components/workorder/detail/WorkOrderHeaderSection.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
