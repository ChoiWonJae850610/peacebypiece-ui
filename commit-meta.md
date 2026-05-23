Version : 0.16.3
Summary : 발주서 PDF 요청사항 제한 및 생성 중 표시 보정
Description : 발주요청 모달의 요청사항 입력을 13줄/400자로 제한하고 PDF 출력에서도 동일하게 잘림 없이 고정 영역 안에 표시되도록 보정했습니다. 대표 이미지와 요청사항 영역 높이를 통일하고, 발주서 PDF 생성/재생성 중 버튼과 처리 메시지가 명확히 보이도록 개선했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/OrderRequestConfirmModal.tsx
- components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
- components/workorder/WorkOrderWorkspace.tsx
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/workorder/presentation/orderRequestDocumentPrint.ts
추가 파일 목록 :
삭제 파일 목록 :
