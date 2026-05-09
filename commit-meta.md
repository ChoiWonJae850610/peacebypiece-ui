Version :
0.9.22415

Summary :
고객관리자와 작업지시서 i18n 하드코딩 정리 1차

Description :
고객관리자 상단 제목, 작업지시서 진행 단계, 발주 정보, 생산 구성, 검수 모달, 기본정보 모달에 남아 있던 한영 혼합 문구를 현재 locale 기준으로 표시하도록 정리했다. 작업지시서 표시값 변환 helper를 추가하고, DB에 저장된 사용자 데이터는 자동 번역하지 않는 기준을 문서화했다.

수정 파일 목록 :
- components/admin/layout/AdminTopbar.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/shared/detailEditorShared.tsx
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/modals/OrderInspectionModal.tsx
- components/workorder/detail/modals/BasicInfoEditModal.tsx
- components/workorder/list/WorkOrderListCard.tsx
- lib/workorder/detail/detailFormatting.ts
- lib/workorder/presentation/workOrderDisplayTranslation.ts
- lib/i18n/en/workorder.ts
- lib/i18n/ko/workorder.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-admin-i18n-hardcoding-sweep-0.9.22415.md

삭제 파일 목록 :
없음
