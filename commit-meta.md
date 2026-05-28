Version : 0.17.82
Summary : 공통 UI 래퍼의 빌드 의존성 오류 보정과 작업지시서 UI 적용 시작
Description : tailwind-merge/class-variance-authority/Radix Slot 직접 import로 발생한 빌드 실패를 막기 위해 공통 UI 래퍼를 dependency-free 구현으로 보정하고, 작업지시서 목록 상태 배지와 상세 요약 카드에 App UI 래퍼를 1차 적용했습니다.
수정 파일 목록 :
- components/common/ui/AppBadge.tsx
- components/common/ui/AppButton.tsx
- components/common/ui/AppCard.tsx
- components/workorder/detail/WorkOrderDetailVisualSummary.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/constants/app.ts
- lib/utils.ts
추가 파일 목록 :
삭제 파일 목록 :
