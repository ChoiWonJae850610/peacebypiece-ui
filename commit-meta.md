Version : 0.16.86
Summary : 멤버관리 검색 필터 패널 컴포넌트 분리
Description : 멤버관리 화면의 검색어, 상태 필터, 역할 필터 control 영역을 AdminMemberDirectoryControls 컴포넌트로 분리하고 대시보드 본문은 조립 구조에 가깝게 축소했습니다. 동작 정책, 권한 처리, 초대/승인 흐름, DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- components/admin/members/AdminMemberDirectoryControls.tsx
삭제 파일 목록 :
