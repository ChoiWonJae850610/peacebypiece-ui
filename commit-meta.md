Version :
0.9.187

Summary :
대표 디자인 이미지 정책과 공장 비용 계산식을 보완

Description :
최초 디자인 이미지 업로드 시 대표 이미지로 자동 지정하고, 대표 디자인 이미지 삭제 시 남은 디자인 이미지 중 하나를 대표로 재지정하도록 보완했다. 삭제된 디자인 이미지는 대표 상태를 해제해 복원 시 대표 이미지가 되지 않도록 했다. 공장 공임비는 수량을 곱한 금액으로 계산하고 로스비는 그대로 더하는 기준으로 비용 요약과 PDF 금액 계산식을 보정했다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/workorder/derived/workOrderCostSummary.ts
- lib/workorder/detail/detailCalculations.ts
- lib/workorder/persistence/dbAttachmentMemoRepository.ts
- lib/workorder/presentation/orderRequestDocumentPresentation.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
