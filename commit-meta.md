Version :
0.9.161

Summary :
작업지시서 삭제 확인을 앱 내부 모달로 교체

Description :
작업지시서 삭제 시 브라우저 기본 confirm을 사용하지 않고 앱 내부 확인 모달을 표시하도록 변경했다. 삭제 대상 작업지시서명을 모달에 표시하고, 작업지시서가 목록에서 숨겨진다는 안내를 추가했다. 기존 삭제 API와 첨부, 메모, R2, purge 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/workorder/useWorkOrderLifecycleActions.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- components/common/modal/WorkOrderDeleteConfirmModal.tsx
- docs/workorder-delete-confirm-modal-0.9.161.md

삭제 파일 목록 :
없음
