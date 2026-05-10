Version :
0.9.224347

Summary :
작업지시서 저장 정책 회귀와 메모 key 중복 오류 수정

Description :
lazy load 적용 후 작업지시서 일반 입력 변경이 즉시 DB 저장처럼 처리되던 흐름을 local draft 중심으로 보정했다. 검수 완료 저장 실패 시 저장 중 상태가 고정되지 않도록 실패 경로를 정리하고, 같은 내용의 메모나 댓글을 여러 번 등록할 때 React key 중복 오류가 발생하지 않도록 메모 생성/렌더링 기준을 DB id 중심으로 수정했다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-save-policy-and-memo-key-regression-0.9.224347.md

삭제 파일 목록 :
없음
