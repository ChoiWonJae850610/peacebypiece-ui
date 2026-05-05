Version :
0.9.1992

Summary :
기본정보 수정 시 통계용 분류 ID 저장 보완

Description :
작업지시서 기본정보 수정 모달에서 대분류, 중분류, 소분류를 변경하면 화면 표시용 분류명과 함께 spec_sheets의 category1_id, category2_id, category3_id에 대응되는 item_categories ID도 같이 저장되도록 보완했다. 생성 시 저장된 통계용 분류 ID가 수정 시에도 동기화되도록 하고, 시즌/연도 제거 및 추천분류 숨김 정책은 유지했다.

수정 파일 목록 :
- components/workorder/detail/modals/BasicInfoEditModal.tsx
- components/workorder/detail/shared/detailEditorShared.tsx
- lib/hooks/workorder/useWorkOrderDetailEditor.ts
- lib/workorder/normalizeRules.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
