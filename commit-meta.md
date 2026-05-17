Version :
0.13.46

Summary :
업무홈 개인 프로필과 기준정보 빌드 오류 수정

Description :
업무홈 공통 상단 액션의 개인설정 아이콘을 사람 모양으로 변경하고, 내 프로필 모달에서 이름, 연락처, 생년월일을 저장할 수 있도록 추가했다. 저장된 이름은 회사 멤버 표시명으로 함께 저장되어 작업지시서 담당자 표시 기준에 사용할 수 있다. 기준정보 외주 공정 API의 writable repository 타입 가드 누락으로 발생한 빌드 오류도 수정했다.

수정 파일 목록 :
- app/api/admin/standards/processes/route.ts
- app/api/auth/me/route.ts
- components/me/PersonalSettingsPage.tsx
- components/workspace/MemberWorkspaceTopbarActions.tsx
- lib/constants/app.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/common.ts

추가 파일 목록 :
- app/api/me/profile/route.ts
- lib/me/profileRepository.ts

삭제 파일 목록 :
없음
