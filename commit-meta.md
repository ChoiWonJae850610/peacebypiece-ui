Version : 0.15.93
Summary : 발주요청 모달 인쇄 제거 및 발주서 자동 첨부 기반 준비
Description : 기존 발주요청 모달의 대표 이미지/미리보기 구조는 유지하고 인쇄 버튼을 제거했습니다. 최종 버튼명은 발주요청으로 정리하고, 발주 메모가 발주요청 payload에 포함되도록 연결했습니다. 이후 서버 생성 발주서 PDF를 첨부파일로 등록할 수 있도록 시스템 생성 첨부파일 구분 컬럼, R2 generated/order-request key 정책, 파일명/스토리지 키 helper를 추가했습니다.
수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderWorkflowActions.ts
- lib/i18n/en/common.ts
- lib/i18n/ko/common.ts
- lib/storage/r2/r2Keys.ts
- lib/workorder/persistence/attachmentMemoTypes.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- lib/workorder/workflowPermissionPolicy.ts
- lib/workorder/workspace/viewModelTypes.ts
- types/workorder.ts
추가 파일 목록 :
- db/migrations/patch_0_15_93_generated_order_request_attachments.sql
- lib/workorder/generatedDocuments.ts
삭제 파일 목록 :
- 없음
