Version :
0.10.1

Summary :
개인 설정 진입점 추가

Description :
개인 설정과 조직 설정을 분리하기 위해 /me/settings 진입점을 추가하고, 언어·색상·화면 밀도·기본 진입 화면 후보를 사용자별 localStorage 설정으로 관리하도록 1차 구현했다. 고객관리자 상단바와 멤버 홈에서 개인 설정으로 이동할 수 있게 연결했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workspace/MemberWorkspaceHome.tsx
- components/admin/layout/AdminTopbar.tsx
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
- lib/me/personalSettings.ts
- components/me/PersonalSettingsPage.tsx
- app/me/settings/page.tsx
- docs/personal-settings-entry-0.10.1.md

삭제 파일 목록 :
없음
