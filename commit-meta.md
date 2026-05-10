Version :
0.9.224346

Summary :
작업지시서 상세 lazy load 로딩 UX와 중복 호출 방지 보정

Description :
작업지시서 상세 lazy load 적용 이후 선택 상세가 아직 준비되지 않은 동안 중앙 상세와 우측 패널에 로딩 상태를 표시하고, 저장/첨부/메모/상태 변경 액션이 먼저 실행되지 않도록 잠금 처리했다. 동일 상세 요청이 중복 호출되지 않도록 in-flight id 관리도 추가했다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-lazy-load-regression-0.9.224346.md

삭제 파일 목록 :
없음
