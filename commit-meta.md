Version :
0.9.174

Summary :
작업지시서 단위 처리 범위 확인 모달 추가

Description :
통합 휴지통에서 작업지시서 대표 row의 복원/영구삭제 버튼을 실제 API 호출 대신 처리 범위 확인 모달로 연결했다. 모달에는 작업지시서 대표 row, 묶음 처리 첨부, 복원 불가 파일, 연결 파일 용량과 서버 방어 기준 안내를 표시한다. 실제 작업지시서 복원/영구삭제 API, DB schema, R2 Worker 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/admin/files/FileTrashSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
