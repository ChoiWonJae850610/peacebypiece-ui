Version :
0.12.48

Summary :
직접 그리기 런타임 device 판정 보정

Description :
직접 그리기 모달이 작업지시서 레이아웃 variant를 그대로 사용하지 않고 실제 입력 장치 특성으로 drawing 전용 device variant를 다시 계산하도록 수정했다. PC에서 창을 줄여도 desktop editor를 유지하고, tablet landscape에서는 tablet editor의 portrait 전용 차단 안내가 표시되도록 보정했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- components/workorder/drawing/drawingDevicePolicy.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
