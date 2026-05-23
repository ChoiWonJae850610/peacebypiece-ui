Version : 0.15.94
Summary : 발주요청 버튼 화살표 제거 및 서버 PDF 생성 1차 추가
Description : 발주요청 모달의 최종 버튼을 아이콘 없이 텍스트만 표시하도록 정리하고, 발주서 PDF 서버 생성 1차 API와 PDF 버퍼 생성 유틸을 추가했습니다. 이번 버전은 R2/Neon 자동 첨부 전 단계로, 작업지시서 데이터를 서버에서 조회해 application/pdf 응답을 생성하는 기반입니다.
수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/constants/app.ts
추가 파일 목록 :
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/workorder/serverOrderRequestPdf.ts
삭제 파일 목록 :
- 없음
