Version :
0.9.1941

Summary :
작업지시서 전역 쓰기 잠금 누락과 빌드 오류 보완

Description :
권한 적용 콜백 인자 전달 오류를 수정해 TypeScript 빌드 실패 원인을 보완했다. 리오더와 삭제 등 작업지시서 CUD 처리 중에도 검토완료, 반려, 발주요청 같은 상태 전환 버튼이 비활성화되도록 액션 섹션에 전역 쓰기 잠금 상태를 전달했다. 기존 전역 쓰기 잠금 범위는 되돌리지 않고 유지했다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
