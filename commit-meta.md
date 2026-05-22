Version :
0.15.67.1

Summary :
멤버 권한 조회 기준과 개인 프로필 필수값 회귀 보정

Description :
멤버 업무 카드와 기준정보·협력업체 화면을 조회 전용 기준으로 유지하도록 기본 조회 권한 병합 기준을 공통화했다. 작업지시서 생성 버튼은 실제 생성 권한 기준으로만 활성화되도록 보정하고, 개인 프로필은 이름과 연락처만 필수로 두며 생년월일은 선택 입력 및 삭제가 가능하도록 수정했다. 프로필 미완성 안내 모달은 같은 세션에서 반복 표시되지 않도록 조정했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- components/me/PersonalSettingsPage.tsx
- components/workspace/MemberWorkspaceTopbarActions.tsx
- lib/admin/members/memberWorkspaceAccess.ts
- lib/constants/app.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/common.ts
- lib/me/profileRepository.ts
- lib/navigation/memberWorkspaceCards.ts
- lib/permissions/permissionAccess.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
