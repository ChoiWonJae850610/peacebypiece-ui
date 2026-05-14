Version :
0.12.25

Summary :
tldraw 고급 그리기 개발 플래그와 의존성 정식화

Description :
tldraw를 package.json dependency로 정식 포함하고, 고급 그리기 메뉴를 development runtimeMode와 NEXT_PUBLIC_ENABLE_TLDRAW_POC=true 조건에서만 노출하도록 정리했다. 브라우저 bare dynamic import 오류를 줄이기 위해 tldraw dynamic import를 Next 번들러가 해석할 수 있는 구조로 바꾸고, 전역 CSS import를 복원했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/runtime/runtimeMode.ts
- app/layout.tsx
- package.json
- components/workorder/drawing/WorkOrderTldrawDrawingModal.tsx

추가 파일 목록 :
- docs/workorder-tldraw-dev-flag-0.12.25.md

삭제 파일 목록 :
없음
