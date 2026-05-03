Version :
0.9.146

Summary :
관리자 설정 모달 토글 행 구조 통일

Description :
로그 이벤트 모달에 남아 있던 기존 ON/OFF pill 버튼을 공통 토글 기준으로 교체했다. AdminSettingsToggleRow 공통 컴포넌트를 추가해 로그 이벤트, 알림 정책, 파일 정책 모달의 토글 행 높이와 간격을 맞췄다. 저장 API, DB schema, R2/첨부/메모/purge 기능은 변경하지 않았다.

수정 파일 목록 :
- components/admin/notification/AdminNotificationSettingsSection.tsx
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- components/admin/common/AdminSettingsToggleRow.tsx
- docs/admin-settings-toggle-row-0.9.146.md

삭제 파일 목록 :
없음
