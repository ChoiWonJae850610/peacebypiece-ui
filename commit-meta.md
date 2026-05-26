Version : 0.16.89
Summary : 멤버관리 리팩토링 안정화
Description : 멤버관리 viewModel에 활성 탭 조회와 목록 로딩 상태 판단 helper를 추가하고, 대시보드의 중복 탭 조회 및 인라인 로딩 조건을 정리했습니다. 사용하지 않는 내부 helper를 제거하고 긴 상태 선언을 정리했습니다. 권한/초대/승인/저장 정책, DB schema, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementViewModel.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
