Version :
0.9.1971

Summary :
테마 토큰 적용 후 모달과 토스트 배경 대비 보정

Description :
공통 테마 토큰 구조는 유지하면서 모달 본체와 header/footer chrome의 배경을 불투명 surface 기준으로 보정했다. 하단 중앙 토스트의 배경과 텍스트 대비를 강화하고, 공통 카드 border와 shadow를 보강해 비용 요약과 발주요청 preview 영역의 분리감을 개선했다.

수정 파일 목록 :
- app/globals.css
- components/common/ToastMessage.tsx
- components/common/modal/BaseModal.tsx
- components/common/modal/ModalHeader.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
