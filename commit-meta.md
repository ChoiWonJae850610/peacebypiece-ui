Version :
0.9.22388

Summary :
저장소 휴지통 모달 컴포넌트 리팩토링

Description :
고객관리자 저장소 휴지통 화면의 비우기 확인 모달, 작업지시서 범위 확인 모달, 상세 모달을 별도 파일로 분리했다. 기존 휴지통 row 생성, 컬럼 렌더링, 선택 상태 계산, 복원/선택 삭제/비우기 동작은 변경하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/files/fileTrashSectionModals.tsx
- docs/storage-refactor-trash-modals-0.9.22388.md

삭제 파일 목록 :
없음
