Version :
0.9.147

Summary :
관리자 설정 모달 footer와 입력 행 정렬 기준 통일

Description :
관리자 설정 관련 모달의 하단 버튼 영역을 AdminModalFooterActions 기준으로 통일했다. 로그 이벤트, 파일 정책, 알림 정책, 생산품 유형, 단위 표준, 외주 공정 유형 모달의 기본값 복원/저장 버튼 정렬과 저장 중 비활성화 처리를 맞췄고, 에러 메시지는 footer 상태 영역에서 확인할 수 있도록 정리했다. 기존 저장 API, DB schema, R2/첨부/메모/purge 로직은 변경하지 않았다.

수정 파일 목록 :
- components/admin/layout/AdminModal.tsx
- components/admin/AdminNotificationSettingsModal.tsx
- components/admin/standards/AdminFilePolicySettingsModal.tsx
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx
- components/admin/standards/AdminItemCategoryManagementModal.tsx
- components/admin/standards/AdminUnitManagementModal.tsx
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/admin-settings-modal-layout-0.9.147.md

삭제 파일 목록 :
없음
