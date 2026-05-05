Version :
0.9.1993

Summary :
기본정보 수정 즉시 저장과 쓰기 잠금 보완

Description :
기본정보 수정 적용 시 통계용 분류 ID와 분류 이름값이 즉시 DB에 저장되도록 작업지시서 patch 저장 흐름을 보완했다. 기본정보 저장 중에도 기존 CUD 전역 쓰기 잠금 규칙이 적용되도록 작업지시서 업데이트 요청을 workspace write lock으로 감쌌다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
