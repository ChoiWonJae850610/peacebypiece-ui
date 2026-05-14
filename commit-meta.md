Version :
0.12.1

Summary :
theme file 변수 동기화 기준 보강

Description :
default-light 테마 파일과 app/globals.css 런타임 mirror 변수 동기화 상태를 점검하고, 후속 테마 provider 연결 전에 사용할 theme variable sync 기준 파일과 문서를 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/theme/semanticThemeTokens.ts

추가 파일 목록 :
- lib/theme/themeVariableSync.ts
- docs/theme-variable-sync-0.12.1.md

삭제 파일 목록 :
없음
