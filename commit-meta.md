Version :
0.11.84

Summary :
runtimeMode 작업지시서 개발 전용 UI 기본값 보정

Description :
작업지시서 화면의 DB 연결 배지와 사용자 변경 톱니바퀴가 runtimeMode 전달 누락 시에도 운영 화면에 노출되지 않도록 PC/모바일 컴포넌트와 permission modal builder의 기본값을 운영 안전 기준으로 보정했다. APP_VERSION을 0.11.84로 갱신하고 작업지시서 runtimeMode 표시 기준 문서를 추가했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/layout/SidebarContent.tsx
- components/layout/MobileTopBar.tsx
- lib/workorder/workspace/builders/modalBuilders.ts

추가 파일 목록 :
- docs/runtime-mode-workorder-visibility-0.11.84.md

삭제 파일 목록 :
없음
