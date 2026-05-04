Version :
0.9.175

Summary :
통합 휴지통 작업지시서 row 액션 UX 단순화

Description :
통합 휴지통에서 대표 row 선택 버튼과 선택된 작업지시서 상단 패널을 제거했다. 작업지시서 대표 row의 작업 버튼 문구를 개별 첨부파일과 동일하게 복구와 영구 삭제로 통일하고, 버튼 클릭 시 기존 공통 모달 구조를 사용해 처리 범위 확인 모달을 표시하도록 정리했다. 실제 작업지시서 복구와 영구삭제 API는 아직 연결하지 않았다.

수정 파일 목록 :
- app/admin/files/page.tsx
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
