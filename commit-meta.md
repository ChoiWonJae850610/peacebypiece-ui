Version :
0.13.47

Summary :
멤버관리 탭 단순화와 승인 역할 선택 보강

Description :
멤버관리 화면에서 별도 권한관리 탭을 제거하고 멤버 초대와 멤버 관리 중심으로 단순화했다. 승인 대기 멤버는 승인 전 역할을 선택한 뒤 해당 역할의 기본 권한으로 승인할 수 있도록 정리했다. 고객사 관리자 멤버는 상세 수정 대상에서도 제외하고, 기준정보 외주 공정 저장 API의 빌드 타입 오류도 수정했다.

수정 파일 목록 :
- app/api/admin/standards/processes/route.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberManagementPresentation.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
