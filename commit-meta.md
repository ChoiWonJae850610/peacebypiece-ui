Version :
0.12.50

Summary :
직접 그리기 iPad 화면 전환 시 모달 유지 보정

Description :
직접 그리기 모달이 열린 상태에서 iPad 가로/세로 전환 시 editor variant가 다시 계산되어 모달 shell이 흔들리는 문제를 줄이도록, 모달 open 중에는 drawing editor variant를 고정했다. tablet 판정은 viewport 변화보다 screen 기준을 우선하도록 보정해 iPad Safari의 주소창/툴바 resize 영향을 줄였다.

수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/drawing/WorkOrderDrawingModal.tsx
- components/workorder/drawing/drawingDevicePolicy.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
