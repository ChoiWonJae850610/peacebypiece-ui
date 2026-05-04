Version :
0.9.169

Summary :
저장소 관리를 휴지통 단일 화면으로 단순화

Description :
/admin/files의 작업지시서, 첨부파일목록, 휴지통 탭 구조를 제거하고 삭제된 작업지시서와 첨부파일을 하나의 휴지통 목록에서 확인하도록 변경했다. 작업지시서 삭제 항목은 대표 row로 표시하고, 작업지시서 종속 첨부파일은 묶음 처리 정책 row로 표시한다. 실제 작업지시서 복원과 영구삭제 API는 아직 연결하지 않고 준비중 버튼으로 표시했다.

수정 파일 목록 :
- app/admin/files/page.tsx
- components/admin/files/FileTrashSection.tsx
- lib/admin/adminFiles.presentation.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
