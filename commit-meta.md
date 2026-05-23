Version : 0.15.95
Summary : 발주서 PDF 빌드 오류 보정 및 자동 첨부 1차 연결
Description : NextResponse Buffer 타입 오류를 제거하고, 발주요청 완료 후 서버에서 발주서 PDF를 생성해 R2에 업로드한 뒤 시스템 생성 첨부파일로 등록하는 1차 흐름을 연결했습니다. PDF 생성 실패 시 발주요청 자체는 유지하고 실패 토스트를 표시합니다.
수정 파일 목록 :
- app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
없음
삭제 파일 목록 :
없음
