Version : 0.16.84
Summary : 멤버관리 초대 링크 목록 컬럼 빌더 분리
Description : 멤버관리 대형 TSX 분리 4차로 초대 링크 목록 테이블 컬럼과 초대 상태 표시/복사/취소 액션 렌더링을 별도 컴포넌트 파일로 분리했습니다. AdminMemberManagementDashboard는 초대 목록 상태와 핸들러를 주입하는 역할만 유지합니다. 앱 버전을 0.16.84로 올렸으며 DB schema, 권한 정책, 초대 API 동작은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- components/admin/members/AdminMemberInvitationTableColumns.tsx
삭제 파일 목록 :
- 없음
