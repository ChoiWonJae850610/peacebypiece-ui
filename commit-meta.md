Version :
0.10.87

Summary :
승인 대기 화면 상태별 표시 보강

Description :
/pending 화면에서 가입 신청 상태 조회 시 pending만 강제 조회하던 구조를 개선하고, join_requests.status 기준으로 승인 대기, 승인 완료, 거절, 취소 상태별 안내와 이동 액션을 분기하도록 보강했다.

수정 파일 목록 :
- components/invitations/PendingApprovalDashboard.tsx
- lib/invitations/pendingApprovalDashboardPresentation.ts
- lib/invitations/api/joinRequestRouteHandlers.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
