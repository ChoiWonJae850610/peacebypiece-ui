Version :
0.13.89

Summary :
고객사 멤버 초대 목록과 취소 흐름 안정화

Description :
고객사 관리자 멤버 초대 화면에서 DB에 저장된 멤버 초대 링크 목록을 다시 불러오도록 보정했다. 문자 전달용 초대도 실제 초대 링크를 생성하도록 하고, 고객사 관리자가 자기 회사의 멤버 초대 링크만 취소할 수 있게 서버 취소 흐름을 분리했다. 멤버 가입 승인 후 초대 목록도 다시 동기화되도록 수정했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/invitations/invitationPolicy.ts
- lib/invitations/invitationRepository.ts
- lib/invitations/invitationTypes.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
