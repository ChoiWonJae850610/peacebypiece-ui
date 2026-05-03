Version :
0.9.120

Summary :
작업지시서 route prerender 중 i18n provider 누락 오류 보완

Description :
/worker 빌드 prerender 중 WorkOrderWorkspace에서 useI18n이 I18nProvider 밖에서 실행되는 오류를 막기 위해 작업지시서 진입 route에서 I18nProvider와 WorkorderRepositoryProvider를 명시적으로 감싸도록 수정했다. 동일한 WorkOrderWorkspace를 사용하는 루트 작업지시서 화면에도 같은 route boundary를 적용했다. 기존 API, repository, DB schema, package 파일은 변경하지 않았다.

수정 파일 목록 :
- app/page.tsx
- app/worker/page.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
