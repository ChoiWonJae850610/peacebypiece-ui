Version :
0.9.195

Summary :
작업지시서 직접 문구 i18n 1차 정리

Description :
작업지시서 화면의 처리 중 문구, 로딩 fallback, PDF 출력/발주요청 문서 미리보기 문구 일부를 i18n 기준으로 이동했다. 기존 기능 동작은 유지하고, 작업지시서 write lock과 PDF 출력 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/layout/WorkOrderDetailDesktopView.tsx
- components/workorder/layout/WorkOrderDetailMobileView.tsx
- components/workorder/layout/WorkOrderDetailTabletView.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
