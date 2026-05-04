Version :
0.9.153

Summary :
작업지시서 발주요청 확인 영역 정렬

Description :
발주요청 확인 모달에서 대표 이미지 영역과 요청사항 영역을 같은 카드 구조로 정리했다. 두 영역의 헤더 높이, 테두리, 패딩, 최소 높이를 맞추고 요청사항 상단의 불필요한 대표 이미지 안내 문구를 제거했다. 출력/PDF 생성 로직, 상태 변경, 첨부/메모 저장, R2/Worker/purge 로직은 변경하지 않았다.

수정 파일 목록 :
- components/common/modal/OrderRequestConfirmModal.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-order-request-preview-0.9.153.md

삭제 파일 목록 :
없음
