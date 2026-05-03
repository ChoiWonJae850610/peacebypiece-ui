Version :
0.9.144

Summary :
자동 purge 스케줄러 도입 검토 문서 추가

Description :
시스템관리자 R2 purge 기능의 자동화 도입 여부를 검토하고, 수동 실행 유지, Vercel Cron, Cloudflare Scheduled Trigger 방식을 비교했다. 초기 운영에서는 자동 purge를 켜지 않고 시스템관리자 수동 실행을 유지하는 기준을 문서화했다. 실제 자동 purge 기능, DB schema, R2 직접 SDK 삭제 방식, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/system-storage-auto-purge-scheduler-0.9.144.md

삭제 파일 목록 :
없음
