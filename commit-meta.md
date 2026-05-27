Version : 0.17.31
Summary : 작업지시서 비용·공정 정보 문구와 발주 요청 모달 조건 정리
Description : 발주 요청 확인 모달의 납기일 버튼 활성 조건을 제거하고, 작업지시서 PC 상세의 비용/공정/제품 구성 섹션명을 정리했습니다. 비용 요약은 외주 합계를 분리 표시하지 않고 모든 공정 단가 합계를 공임비로 통합하며, 로스비는 수량 기준 합계로 표시하도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/OrderRequestConfirmModal.tsx
- components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
- components/workorder/detail/WorkOrderCostSummarySection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- lib/workorder/derived/workOrderCostSummary.ts
- lib/workorder/presentation/orderRequestDocumentPresentation.ts
- lib/workorder/presentation/workOrderDetailSectionProps.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
