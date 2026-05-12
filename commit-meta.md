Version :
0.10.81

Summary :
고객관리자 멤버 승인 대기 목록 실제 조회 연결

Description :
고객관리자 멤버관리 화면에서 join_requests.pending 멤버 가입 신청을 실제 API로 조회하도록 연결했다. join_requests 목록 조회에 invitation scope 필터와 초대 이메일 요약을 추가하고, 신청자 연락처, 메모, 신청일, 초대 이메일 비교 상태를 표시하도록 보강했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/invitations/joinRequestRepository.ts
- lib/invitations/joinRequestTypes.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
