Version :
0.12.0

Summary :
작업지시서 테마 파일 구조 1차 분리

Description :
작업지시서 semantic token을 프로젝트 전체 테마 구조로 확장하기 위한 theme type, 기본 테마 정의, theme registry를 추가했다. 현재 globals.css의 CSS 변수값을 default-light 테마 파일에 반영하고, 동적 테마 적용 전까지 CSS 변수와 테마 파일을 동기화하는 기준을 문서화했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts

추가 파일 목록 :
- lib/theme/themeTypes.ts
- lib/theme/themes/defaultLight.ts
- lib/theme/themeRegistry.ts
- docs/theme-file-structure-0.12.0.md

삭제 파일 목록 :
없음
