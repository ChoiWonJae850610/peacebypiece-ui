Version : 0.16.88
Summary : 멤버관리 viewModel 1차 도입
Description : 멤버관리 화면의 요약 카드 계산, 탭 count/label 구성, 멤버 목록 필터링 계산을 memberManagementViewModel로 분리했습니다. 화면 컴포넌트의 직접 계산을 줄였고, 권한/초대/승인/저장 정책과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- lib/admin/members/memberManagementViewModel.ts
삭제 파일 목록 :
- 없음
