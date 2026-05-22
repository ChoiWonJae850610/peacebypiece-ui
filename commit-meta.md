Version :
0.15.67.2

Summary :
멤버 역할과 권한 체크 기준 분리

Description :
멤버 역할은 담당자 표시와 업무 구분용으로 유지하고 실제 접근 권한은 권한 체크 항목으로 결정되도록 정리했다. 조회 전용 역할은 신규 선택지에서 제거하고 디자이너, 검수 담당, 재고/자재 담당만 배정 가능한 역할로 제한했다. 역할 변경 시 권한이 자동 변경되지 않게 하고, 명시적으로 역할 기본값을 적용할 때만 체크 항목을 바꾸도록 수정했다.

수정 파일 목록 :
- lib/permissions/memberPermissionMatrix.ts
- lib/admin/members/memberManagementPresentation.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/invitations/invitationPolicy.ts
- lib/invitations/api/invitationRouteHandlers.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts
- lib/admin/companyMemberInviteSkeleton.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
