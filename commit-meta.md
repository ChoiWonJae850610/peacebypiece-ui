Version : 0.16.85
Summary : 멤버관리 초대 생성 패널 컴포넌트 분리
Description : 멤버관리 대형 TSX 정리를 이어서 초대 링크 생성 패널 본문을 AdminMemberInviteBuilderPanel 컴포넌트로 분리했습니다. 초대 만료 선택, 링크 생성 버튼, 안내/오류 표시 UI를 별도 컴포넌트로 이동하고 기존 초대 생성/취소/목록/권한 정책은 변경하지 않았습니다.
수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/constants/app.ts
추가 파일 목록 :
- components/admin/members/AdminMemberInviteBuilderPanel.tsx
삭제 파일 목록 :
- 없음
