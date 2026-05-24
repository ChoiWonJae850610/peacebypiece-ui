Version : 0.16.9
Summary : 작업지시서 controller 이벤트 흐름 정리
Description : WorkOrderWorkspace 내부의 작업지시서 선택, 목록 필터, 삭제 확인, 첨부 삭제, workflow 처리 이벤트를 controller hook으로 분리했습니다. 화면 컴포넌트는 WorkOrderLayout, WorkOrderOverlay, 삭제 확인 모달 렌더링만 담당하도록 축소했습니다. DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/constants/app.ts
추가 파일 목록 :
- features/workorders/controllers/useWorkOrderWorkspaceController.ts
삭제 파일 목록 :
- 없음
