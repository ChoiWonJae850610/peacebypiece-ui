Version :
0.12.53

Summary :
iPad 직접 그리기 모달 세로 복귀 안정화

Description :
iPad에서 직접 그리기 모달을 연 상태로 가로모드 전환 후 다시 세로모드로 복귀할 때 모달 레이어가 화면 밖으로 밀리거나 바깥 화면처럼 보이는 문제를 줄이기 위해, 직접 그리기 모달에서만 body position fixed 기반 스크롤 잠금을 끄고 overflow 기반 잠금으로 처리할 수 있도록 공통 모달 환경에 선택 옵션을 추가했다. iPad 전용 editor의 viewport 안정화 값도 visualViewport 단일 우선값이 아니라 사용 가능한 viewport 후보 중 안정적인 값을 사용하도록 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/modalUtils.ts
- components/common/modal/ModalShell.tsx
- components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx
- components/workorder/drawing/WorkOrderDrawingIpadEditor.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
