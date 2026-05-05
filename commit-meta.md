Version :
0.9.198

Summary :
발주요청 PDF 모달 구조 리팩토링

Description :
발주요청 확인 모달에서 문서 미리보기와 테이블 렌더링을 별도 컴포넌트로 분리했다. PDF 출력, 발주요청 실행, 토스트 동작은 기존 흐름을 유지하고 기능 동작은 변경하지 않았다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx

삭제 파일 목록 :
없음
