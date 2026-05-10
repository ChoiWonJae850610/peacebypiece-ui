Version :
0.9.224342

Summary :
통계 seed와 R2 더미 파일 매칭 구조 보정

Description :
통계 테스트 seed의 첨부 metadata와 R2 더미 파일 생성 스크립트가 같은 작업지시서 storage_key 기준으로 매칭되도록 보정했다. R2 manifest에 작업지시서 제목, 상태, 리오더 차수를 포함하고, 통계 검증용 9xx 작업지시서 첨부 우선 선택과 특정 작업지시서 필터 옵션을 추가했다. PowerShell 실행법 문서도 scripts 폴더에 추가했다.

수정 파일 목록 :
- db/schema/seed_realistic_workorders_0_9_2227.sql
- db/schema/seed_realistic_workorders_usage_0_9_224341.md
- scripts/seed-r2-demo-files.mjs
- lib/constants/app.ts

추가 파일 목록 :
- scripts/seed-r2-demo-files-usage.md
- docs/admin-stats-r2-seed-matching-0.9.224342.md

삭제 파일 목록 :
없음
