Version :
0.9.22387

Summary :
저장소 휴지통 액션 상태 리팩토링

Description :
고객관리자 저장소 휴지통 화면의 선택 상태, 버튼 활성화 조건, 작업지시서 묶음 처리 미리보기 계산을 별도 액션 상태 파일로 분리했다. 기존 휴지통 row 생성, 컬럼 렌더링, 복원, 선택 삭제, 비우기 동작은 변경하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/files/fileTrashSectionActions.ts
- docs/storage-refactor-trash-actions-0.9.22387.md

삭제 파일 목록 :
없음
