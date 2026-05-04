Version :
0.9.150

Summary :
작업지시서 detail editor 편집 세션 상태 분리

Description :
작업지시서 detail editor 내부에서 직접 관리하던 editingCell, editingValue, startEdit, cancelEdit 흐름을 useWorkOrderEditingSession hook으로 분리했다. UI, 상태 변경, 첨부, 메모, R2 purge, DB 구조는 변경하지 않았다.

수정 파일 목록 :
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- lib/hooks/workorder/detailEditor/useWorkOrderEditingSession.ts
- docs/workorder-detail-editor-refactor-0.9.150.md

삭제 파일 목록 :
없음
