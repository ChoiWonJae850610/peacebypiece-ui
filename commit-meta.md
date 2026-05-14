Version :
0.12.12

Summary :
개인 설정 언어 테마 hydration 런타임 오류 보정

Description :
개인 설정에서 영어 또는 다른 테마가 localStorage에 저장된 상태로 작업지시서 화면에 진입할 때 서버 렌더링 결과와 클라이언트 최초 렌더링 결과가 달라져 hydration 오류가 발생하던 문제를 수정했다. I18nProvider와 PbpThemeProvider의 최초 렌더링 값은 서버와 동일한 기본값으로 맞추고, 저장된 개인 설정은 마운트 이후 동기화하도록 정리했다. APP_VERSION을 0.12.12로 갱신했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/i18n/I18nProvider.tsx
- lib/theme/PbpThemeProvider.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
