Version : 0.15.96.1
Summary : 발주서 PDF 재생성 빌드 및 실행 오류 보정
Description : 빌드 오류를 유발한 generated PDF 첨부 ID 타입을 보정하고, 작업지시서 facade에 발주서 PDF 생성 핸들러를 노출했습니다. PC 넓은 화면의 첨부파일 패널에도 발주서 PDF 생성 버튼이 보이도록 전달 누락을 보정했으며, 현재 R2 Worker가 허용하는 첨부파일 경로로 발주서 PDF storage key를 맞췄습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/workorder/generatedDocuments.ts
- components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx
- components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections.tsx
- lib/hooks/useWorkOrder.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
