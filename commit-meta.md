Version :
0.12.24

Summary :
고급 그리기 개발 모드 제한과 tldraw 빌드 오류 보정

Description :
tldraw 기반 고급 그리기를 development runtimeMode에서만 노출하도록 제한하고, production build에서 tldraw 정적 import가 모듈 해석 오류를 발생시키지 않도록 optional 로딩 구조로 보정했다. app layout의 tldraw css 정적 import와 package.json의 tldraw dependency를 제거해 일반 build가 추가 설치 없이 진행되도록 정리했다. native canvas 강화 방향도 문서화했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/runtime/runtimeMode.ts
- app/layout.tsx
- package.json
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- components/workorder/drawing/WorkOrderTldrawDrawingModal.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts

추가 파일 목록 :
- docs/workorder-advanced-drawing-dev-mode-0.12.24.md

삭제 파일 목록 :
없음
