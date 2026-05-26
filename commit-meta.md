Version : 0.16.87
Summary : 멤버관리 섹션 wrapper 컴포넌트 분리
Description : 멤버관리 초대 생성/초대 링크 목록 영역과 멤버 목록/필터 영역을 각각 AdminMemberInvitationSection, AdminMemberDirectorySection 컴포넌트로 분리했습니다. AdminMemberManagementDashboard는 탭 선택과 상태 연결 중심의 조립 컨테이너에 가깝게 축소했고, 권한/초대/승인/저장 정책과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- components/admin/members/AdminMemberInvitationSection.tsx
- components/admin/members/AdminMemberDirectorySection.tsx
삭제 파일 목록 :
- 없음
