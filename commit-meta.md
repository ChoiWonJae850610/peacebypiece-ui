Version :
0.12.7

Summary :
개인 설정 테마 적용 회귀 보정

Description :
개인 설정의 theme 선택 이후 관리자 상단바, 작업지시서 상단바, 작업지시서 사이드바, 개인 설정 요약 액션이 theme semantic token을 타도록 보정했다. PbpThemeProvider의 초기 client theme 적용도 localStorage 기준으로 안정화했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/theme/PbpThemeProvider.tsx
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/admin/layout/AdminTopbar.tsx
- components/layout/SidebarContent.tsx
- components/layout/MobileTopBar.tsx
- components/me/PersonalSettingsPage.tsx

추가 파일 목록 :
- docs/personal-theme-regression-0.12.7.md

삭제 파일 목록 :
없음
