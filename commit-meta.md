Version : 0.16.2.2
Summary : 발주서 PDF 대표 이미지 후보 로딩 보정
Description : 발주서 HTML/PDF 생성 시 작업지시서 기본 조회 결과에 포함되지 않던 첨부파일 snapshot을 별도로 로딩해 대표 이미지 resolver에 전달합니다. 대표 이미지 후보 선택 로직을 primary image 우선으로 보강하고, 후보 탐색 실패 로그에 attachment 후보 정보를 포함했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- app/api/workorders/[workOrderId]/generated/order-request-html/route.ts
- lib/generated-documents/order-request/orderRequestRepresentativeImage.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
