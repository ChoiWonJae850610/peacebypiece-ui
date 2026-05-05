Version :
0.9.188

Summary :
작업지시서 생성과 DB 로딩 UX를 보완

Description :
작업지시서 DB 로딩 중 상세/첨부 영역에 skeleton 로딩 화면을 표시하고, 작업지시서 생성 중 모달 입력과 버튼 상태를 로딩 상태로 전환하도록 보완했다. 패키지 의존성은 추가하지 않고 기존 Tailwind 기반 UI만 사용했다.

수정 파일 목록 :
- components/common/modal/CreateWorkOrderModal.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/layout/WorkOrderDetailDesktopView.tsx
- components/workorder/layout/WorkOrderDetailMobileView.tsx
- components/workorder/layout/WorkOrderDetailTabletView.tsx
- components/workorder/layout/types.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- components/workorder/WorkOrderLoadingState.tsx

삭제 파일 목록 :
없음
