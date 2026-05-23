Version : 0.16.0
Summary : 발주서 HTML 미리보기 검증 경로 추가
Description : 발주서 PDF Generator 연결 전에 기존 발주요청 인쇄 양식을 브라우저에서 검증할 수 있도록 HTML 미리보기 API를 추가하고, PDF Generator 입력 HTML을 기존 발주요청 인쇄 HTML 빌더와 동일한 구조로 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/generated-documents/order-request/orderRequestHtmlDocument.ts
추가 파일 목록 :
- app/api/workorders/[workOrderId]/generated/order-request-html/route.ts
- docs/wafl-a-type/100_order-request-html-preview.md
삭제 파일 목록 :
