Version :
0.12.6

Summary :
개인 설정 테마 선택 구조와 진입 아이콘 정리

Description :
/me/settings에서 개인별 테마를 선택하고 localStorage에 저장한 값을 theme provider가 적용하도록 연결했다. 관리자 화면에는 개인 설정 사람 아이콘을 추가하고 기존 톱니바퀴는 관리자 환경설정 전용으로 유지했다. 작업지시서 PC/모바일 상단에도 개인 설정 진입 아이콘을 추가했으며, 테스트용 Beige Atelier 테마 파일을 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/me/personalSettings.ts
- lib/theme/PbpThemeProvider.tsx
- lib/theme/themeRegistry.ts
- lib/theme/themeTypes.ts
- lib/theme/semanticThemeTokens.ts
- components/me/PersonalSettingsPage.tsx
- components/admin/layout/AdminTopbar.tsx
- components/layout/SidebarContent.tsx
- components/layout/MobileTopBar.tsx
- lib/i18n/ko/common.ts
- lib/i18n/en/common.ts

추가 파일 목록 :
- lib/theme/themes/beigeAtelier.ts
- docs/personal-theme-settings-0.12.6.md

삭제 파일 목록 :
없음
