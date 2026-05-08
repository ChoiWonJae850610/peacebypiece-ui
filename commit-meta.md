Version :
0.9.22385

Summary :
저장소 휴지통 화면 표현 컴포넌트 리팩토링

Description :
고객관리자 저장소 휴지통 화면의 시각 배지, 작업지시서 단계 표시, 액션 버튼 className 조합을 별도 presentation 파일로 분리했다. 기존 휴지통 row 생성 로직과 삭제/복원/R2 Worker 기반 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/files/fileTrashSectionPresentation.tsx
- docs/storage-refactor-trash-presentation-0.9.22385.md

삭제 파일 목록 :
없음
