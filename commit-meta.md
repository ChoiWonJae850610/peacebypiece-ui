Version :
0.11.1

Summary :
관리자 버튼과 모달 액션 공통 컴포넌트 1차 정리

Description :
관리자 화면에서 공통으로 사용할 AdminButton과 AdminLinkButton을 추가하고, 기존 AdminModalFooterActions와 환경설정 안내 모달 footer 버튼을 공통 버튼 컴포넌트 기준으로 전환했다. 기존 adminModal 버튼 className export는 호환을 위해 유지했다.

수정 파일 목록 :
- components/admin/layout/AdminModal.tsx
- components/admin/settings/AdminSettingsHub.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/common/AdminButton.tsx
- docs/admin-button-modal-standardization-0.11.1.md

삭제 파일 목록 :
없음
