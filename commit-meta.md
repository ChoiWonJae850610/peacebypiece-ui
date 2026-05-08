Version :
0.9.22408

Summary :
저장소 휴지통 공통 함수와 중복 선택 로직 정리

Description :
저장소 휴지통 선택 처리에서 반복되던 항목 선택, 작업지시서 묶음 제외, 복원/삭제 요청 가능 여부 판정을 trashPolicy 공통 함수로 정리했다. actionFlow와 화면 버튼 상태 계산이 같은 정책 함수를 사용하도록 보정하고 기존 selector/presentation의 선택 함수는 공통 함수 wrapper로 축소했다.

수정 파일 목록 :
- components/admin/files/fileTrashSectionActions.ts
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.presentation.ts
- lib/admin/files/selectors.ts
- lib/admin/files/trashPolicy.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-trash-common-function-cleanup-0.9.22408.md
- commit-meta.md

삭제 파일 목록 :
없음
