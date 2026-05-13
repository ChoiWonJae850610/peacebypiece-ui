Version :
0.11.29

Summary :
관리자 멤버 초대 목록 공통 테이블 적용

Description :
관리자 멤버관리 화면의 초대 대기 목록을 AdminTable 기준으로 정리하고, AdminTable items 타입을 readonly 배열도 받을 수 있도록 보완했다. 멤버 권한 저장과 가입 신청 승인/거절 흐름은 변경하지 않고 잔여 목록 공통화 후보를 문서화했다.

수정 파일 목록 :
- components/admin/common/AdminTable.tsx
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/admin-member-table-list-standardization-0.11.29.md

삭제 파일 목록 :
없음
