Version :
0.9.159

Summary :
작업지시서 드래그 업로드 빌드 오류와 진단 로그 보완

Description :
useWorkOrder의 attachments 반환 객체에 handleAttachmentFileDrop을 포함해 WorkOrderWorkspace의 drag-and-drop 업로드 prop 연결 빌드 오류를 수정했다. 드래그 업로드가 실제 drop 이벤트까지 도달하는지 확인할 수 있도록 개발 환경 전용 콘솔 로그를 추가했다. R2 Worker 업로드, 썸네일 생성, 삭제/복구, 메모 저장 로직은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/hooks/useWorkOrder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-attachment-dnd-build-fix-0.9.159.md

삭제 파일 목록 :
없음
