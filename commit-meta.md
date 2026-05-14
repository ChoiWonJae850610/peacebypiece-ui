Version : 0.11.82
Summary : runtimeMode 구조 1차 개편
Description : runtimeMode를 lib/constants에서 lib/runtime으로 이동하고 NEXT_PUBLIC_APP_RUNTIME_MODE 기반 production 기본값 구조로 정리했습니다. 작업지시서 사용자 변경 톱니바퀴와 DB 연결 배지를 runtime visibility 기준으로 숨길 수 있게 하고, 기존 debug helper import 경로를 새 runtime 모듈로 정리했습니다.
수정 파일 목록 :
- components/common/modal/CreateWorkOrderModal.tsx
- components/common/modal/OrderRequestConfirmModal.tsx
- components/debug/AdminHistoryDebugPanel.tsx
- components/layout/MobileTopBar.tsx
- components/layout/SidebarContent.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/detail/WorkOrderHeaderSection.tsx
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/builders/modalBuilders.ts
- lib/workorder/workspace/builders/sidebarBuilders.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/constants/app.ts
추가 파일 목록 :
- lib/runtime/runtimeMode.ts
- docs/runtime-mode-structure-0.11.82.md
삭제 파일 목록 :
- lib/constants/runtimeMode.ts
