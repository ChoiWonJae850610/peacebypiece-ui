Version : 0.9.22281
Summary : R2 demo upload unsupported/missing file skip 처리
Description : R2 더미 파일 업로드 스크립트에서 ZIP 등 Worker 정책상 허용되지 않는 파일은 기본 업로드 대상에서 제외하고, 업로드 중 정책 거부나 로컬 파일 누락이 발생해도 전체 실행이 중단되지 않도록 skip 처리한다. 업로드 결과에는 성공, 지원 안 됨, 로컬 파일 없음, Worker 정책 거부, 실패 개수를 표시한다.
수정 파일 목록 :
scripts/seed-r2-demo-files.mjs
lib/constants/app.ts
추가 파일 목록 :
docs/r2-demo-upload-skip-0.9.22281.md
삭제 파일 목록 :
없음
