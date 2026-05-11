Version : 0.10.31
Summary : 환경설정 밀도와 모달 흐름 보정
Description : 고객관리자 환경설정 화면의 상단 메뉴 카드 높이와 여백을 줄이고, 기준정보 설정 외 메뉴는 본문 placeholder로 전환하지 않고 즉시 안내 모달만 열리도록 보정했습니다. 기준정보 설정 영역은 계속 본문에 유지하며 권한 관리는 멤버관리에서 다루는 방향을 유지했습니다. 실제 알림, 결제, 계정 변경, 개발 건의 저장, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/settings/AdminSettingsHub.tsx
- components/admin/standards/AdminStandardsSection.tsx

추가 파일 목록 :
- docs/admin-settings-density-modal-0.10.31.md

삭제 파일 목록 :
- 없음
