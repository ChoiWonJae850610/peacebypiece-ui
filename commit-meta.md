Version :
0.9.22384

Summary :
저장소 휴지통 화면 컴포넌트 리팩토링

Description :
고객관리자 저장소 휴지통 화면의 통합 row 생성, 테이블 정렬 상수, 용량 표시, 작업지시서 단계 계산 로직을 별도 파일로 분리했다. 기존 휴지통 UI와 삭제/복원 동작은 유지하고 화면 컴포넌트의 책임을 줄였다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/files/fileTrashSectionRows.ts
- docs/storage-refactor-trash-component-0.9.22384.md

삭제 파일 목록 :
없음
