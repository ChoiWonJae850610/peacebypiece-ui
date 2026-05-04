Version :
0.9.162

Summary :
작업지시서 삭제 휴지통 정책 정리와 삭제 모달 빌드 오류 보완

Description :
작업지시서 삭제 시 연결된 디자인, 첨부파일, 메모 첨부를 함께 휴지통 대상으로 보는 정책을 문서화하고, 삭제 확인 모달 문구를 30일 휴지통 정책 기준으로 정리했다. 삭제 확인 모달의 입력 타입을 WorkOrderListItem 기준으로 좁혀 0.9.161 build 오류를 보완했다.

수정 파일 목록 :
- components/common/modal/WorkOrderDeleteConfirmModal.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-delete-trash-policy-0.9.162.md

삭제 파일 목록 :
없음
