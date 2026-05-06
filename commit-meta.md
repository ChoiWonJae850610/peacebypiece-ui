Version :
0.9.203

Summary :
통계용 schema와 index 1차 반영

Description :
통계 API 1차 구현을 준비하기 위해 작업지시서 일/월 summary table과 저장소 일 summary table을 추가했다. full_reset.sql에 통계 테이블과 aggregate 조회용 index를 반영하고, smoke test에서 통계 테이블/컬럼/index 존재 여부를 검증하도록 보완했다. 기존 데이터 마이그레이션은 필요 없으며 개발 DB 전체 리셋을 전제로 한다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
- db/schema/patch_0_9_203_stats_schema.sql
- docs/stats-schema-index-plan-0.9.203.md

삭제 파일 목록 :
없음
