Version : 0.10.30
Summary : 고객관리자 환경설정 IA 재구성
Description : 고객관리자 환경설정 화면을 기준정보 설정, 알림 정책, 요금제·결제, 계정 설정, 개발 건의 중심의 메뉴형 화면으로 재구성했습니다. 권한 관리는 환경설정에서 제외하고 멤버관리에서 다루는 방향으로 분리했으며, 알림 정책은 2026년 하반기 이후 순차 적용 예정 안내 모달로 표시합니다. 실제 결제, 알림, 계정 변경, 회원 탈퇴, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/admin/settings/page.tsx
- components/admin/standards/AdminStandardsSection.tsx

추가 파일 목록 :
- components/admin/settings/AdminSettingsHub.tsx
- lib/admin/settings/adminSettingsHub.ts
- docs/admin-settings-hub-0.10.30.md

삭제 파일 목록 :
- 없음
