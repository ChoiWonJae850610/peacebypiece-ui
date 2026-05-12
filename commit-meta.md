Version :
0.10.75

Summary :
멤버 초대 권한 감사 로그 이벤트 연결

Description :
초대 생성과 고객사 생성 API에 시스템 감사 로그 연결 지점을 추가하고, 멤버 승인·거절·권한 변경·요금제 변경 감사 로그 빌더를 보강했다. 시스템 감사 로그 설계 화면과 문서도 0.10.75 기준으로 갱신했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/audit/writeActions.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/company/api/companyRouteHandlers.ts
- lib/system/audit/systemAuditLogs.design.ts
- components/system/audit/SystemAuditLogsDesignPage.tsx

추가 파일 목록 :
- docs/member-invitation-permission-audit-events-0.10.75.md

삭제 파일 목록 :
없음
