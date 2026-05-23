Version : 0.16.3.3
Summary : 발주서 PDF 요청사항 영역 및 모달 닫힘 보정
Description : 발주서 PDF의 대표 이미지와 요청사항 영역 폭/높이를 동일한 2단 구조로 맞추고, 긴 요청사항 문자열이 박스 밖으로 밀리지 않도록 줄바꿈을 보강했습니다. 발주요청 성공 후 모달 닫힘 호출도 명시적으로 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/OrderRequestConfirmModal.tsx
- components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx
- lib/workorder/presentation/orderRequestDocumentPrint.ts
추가 파일 목록 :
삭제 파일 목록 :
