Version :
0.12.3

Summary :
theme provider 구조 1차 설계

Description :
default-light 테마의 CSS 변수를 서버 렌더링 시점과 클라이언트 provider에서 document root에 적용할 수 있는 기본 구조를 추가했다. app/layout.tsx에 theme root attributes와 PbpThemeProvider를 연결하고, app/globals.css의 :root는 fallback mirror로 유지하도록 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/layout.tsx
- app/globals.css
- lib/theme/semanticThemeTokens.ts

추가 파일 목록 :
- lib/theme/themeDocument.ts
- lib/theme/PbpThemeProvider.tsx
- docs/theme-provider-structure-0.12.3.md

삭제 파일 목록 :
없음
