Version :
0.12.5

Summary :
공통 UI semantic class 기준 점검

Description :
공통 버튼, 관리자 카드, 필터 바, 토글 컴포넌트가 theme token 기반 semantic class를 사용하도록 1차 정리했다. default-light theme 변수와 globals.css fallback 변수도 동기화했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/themes/defaultLight.ts
- lib/theme/semanticThemeTokens.ts
- components/admin/common/AdminButton.tsx
- components/admin/common/AdminFilterBar.tsx
- components/admin/common/AdminSection.tsx
- components/admin/layout/AdminCard.tsx
- components/common/StatusToggle.tsx

추가 파일 목록 :
- docs/common-ui-semantic-token-0.12.5.md

삭제 파일 목록 :
없음
