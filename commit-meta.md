Version : 0.9.2228
Summary : R2 더미 파일 생성/업로드 스크립트 추가
Description : realistic DB seed의 attachment metadata를 기준으로 로컬 더미 파일을 생성하고 R2 Worker로 업로드/검증할 수 있는 small preset 스크립트를 추가했다. 스크립트는 DATABASE_URL, R2_WORKER_UPLOAD_URL, R2_WORKER_UPLOAD_SECRET을 환경변수에서만 읽으며 secret을 코드에 포함하지 않는다. package.json, package-lock.json, DB schema는 변경하지 않는다.
수정 파일 목록 :
lib/constants/app.ts
추가 파일 목록 :
scripts/seed-r2-demo-files.mjs
docs/r2-demo-upload-0.9.2228.md
삭제 파일 목록 :
없음
