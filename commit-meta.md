Version :
0.10.90

Summary :
R2 더미 파일 메모 첨부 정책 정합성 보정

Description :
R2 더미 파일 seed에서 메모 첨부 metadata를 txt/text/plain 대신 pdf/application/pdf로 생성하도록 수정했다. Worker 정책과 스크립트 허용 파일 정책을 맞추기 위해 R2 더미 업로드 스크립트의 허용 확장자와 MIME 목록에서 txt/text/plain을 제외하고, 사용 문서에 기존 0.10.89 seed 실행 후 full reset부터 다시 실행해야 한다는 안내를 추가했다.

수정 파일 목록 :
- db/seed/realistic_workorders_seed.sql
- scripts/seed-r2-demo-files.mjs
- scripts/seed-r2-demo-files-usage.md
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
