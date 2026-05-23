Version : 0.16.2
Summary : 발주서 PDF 대표 이미지 삽입 연결
Description : 발주서 PDF/HTML 미리보기 생성 시 R2 대표 디자인 이미지를 서버에서 base64 data URL로 변환해 HTML 템플릿에 삽입합니다. 대표 이미지 로딩 실패 시 기존 PDF 생성 흐름은 유지하고 안내 문구로 대체합니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- app/api/workorders/[workOrderId]/generated/order-request-html/route.ts
- lib/generated-documents/order-request/orderRequestHtmlDocument.ts
- lib/workorder/presentation/orderRequestDocumentPrint.ts
- lib/workorder/serverOrderRequestPdf.ts
추가 파일 목록 :
- lib/generated-documents/order-request/orderRequestRepresentativeImage.ts
삭제 파일 목록 :
- 없음
