Version :
0.10.89

Summary :
R2 더미 파일 seed 기준 복구

Description :
삭제된 과거 seed_realistic_workorders SQL을 참조하던 R2 더미 파일 생성 흐름을 현재 reset 기준에 맞게 복구했다. 실제 작업지시서와 첨부 metadata를 생성하는 db/seed/realistic_workorders_seed.sql을 추가하고, seed-r2-demo-files 스크립트와 사용 문서를 새 seed 경로 기준으로 수정했다.

수정 파일 목록 :
- scripts/seed-r2-demo-files.mjs
- scripts/seed-r2-demo-files-usage.md
- lib/constants/app.ts

추가 파일 목록 :
- db/seed/realistic_workorders_seed.sql

삭제 파일 목록 :
없음
