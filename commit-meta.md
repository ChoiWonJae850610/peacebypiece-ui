Version :
0.9.186

Summary :
PDF 요청사항 문구와 출력 토스트 표시 보완

Description :
발주요청 PDF 요청사항에 작업지시서 메모나 생성 안내 문구가 자동으로 들어가지 않도록 요청사항 입력값만 사용하게 정리했다. 요청사항이 비어 있으면 PDF에는 요청사항 없음 문구를 표시한다. PDF 출력 요청 토스트는 출력창으로 포커스가 이동해도 사용자가 돌아온 뒤 확인할 수 있도록 닫힘 타이밍을 보완했다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/workorder/presentation/orderRequestDocumentPrint.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
