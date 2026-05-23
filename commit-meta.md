Version : 0.15.94.1
Summary : 발주서 PDF 빌드 오류 및 첨부 작성자 표시 보정
Description : 발주서 PDF 생성 API에서 존재하지 않는 managerName 참조를 manager 기준으로 수정하고, 첨부파일 작성자 표시에서 UUID가 그대로 노출되지 않도록 보정했습니다. APP_VERSION을 0.15.94.1로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
