Version : 0.15.99
Summary : 발주서 PDF 생성 구조를 HTML 기반 외부 Generator 준비 구조로 전환
Description : 발주서 PDF를 좌표 기반 직접 그리기 방식에서 HTML 문서 기반 PDF Generator 연동 구조로 전환할 수 있도록 HTML 템플릿, 외부 Generator 클라이언트, 환경변수 예시, 설계 문서를 추가했습니다. PDF Generator URL이 설정된 환경에서는 HTML을 외부 Generator로 전송해 application/pdf 응답을 사용하고, 미설정 환경에서는 기존 내부 PDF fallback을 유지합니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/workorder/serverOrderRequestPdf.ts
- .env.example
추가 파일 목록 :
- lib/generated-documents/pdfGeneratorClient.ts
- lib/generated-documents/order-request/orderRequestHtmlDocument.ts
- docs/wafl-a-type/99_order-request-pdf-generator.md
삭제 파일 목록 :
없음
