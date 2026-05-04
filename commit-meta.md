Version :
0.9.158

Summary :
작업지시서 드래그 업로드 drop 이벤트 보완

Description :
디자인/첨부 패널의 dragOver/drop 이벤트 처리를 보완해 파일을 드래그했을 때 실제 업로드 함수까지 도달하도록 정리했다. 점선 안내 영역을 drop 이벤트를 안정적으로 받을 수 있는 구조로 바꾸고, 패널 전체에서도 파일 drop을 받을 수 있게 했다. 기존 파일 선택 업로드, R2 Worker 업로드, 썸네일, 삭제/복구 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-attachment-dnd-drop-0.9.158.md

삭제 파일 목록 :
없음
