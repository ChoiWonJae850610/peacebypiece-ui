Version :
0.12.10

Summary :
개인 설정 언어 다중 탭 동기화 보정

Description :
개인 설정에서 언어를 변경했을 때 테마처럼 같은 탭과 다른 탭에 즉시 반영되도록 I18nProvider의 localStorage 및 개인 설정 변경 이벤트 동기화 구조를 보정했다. legacy 언어 저장 키는 fallback으로 유지하고, document lang 값도 함께 갱신하도록 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/i18n/I18nProvider.tsx
- lib/theme/semanticThemeTokens.ts

추가 파일 목록 :
- docs/personal-language-sync-0.12.10.md

삭제 파일 목록 :
없음
