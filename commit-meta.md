Version :
0.13.55

Summary :
full reset 샘플 seed 제거와 DB 기준 데이터 정리

Description :
full_reset.sql에서 샘플 고객사, 샘플 사용자, 샘플 시스템관리자, 회사별 mock 기준정보, 샘플 요금제 배정, 샘플 저장소 snapshot을 제거하고 시스템 기준정보와 역할 템플릿 같은 운영 baseline만 남겼다. 기존 DB 보강용 system_standards_seed.sql의 용도를 명확히 정리하고, 더 이상 사용하지 않는 고객사/작업지시서 샘플 seed 파일을 삭제했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/seed/system_standards_seed.sql
- lib/constants/app.ts

추가 파일 목록 :
- docs/db/full-reset-cleanup-0.13.55.md

삭제 파일 목록 :
- db/seed/realistic_workorders_seed.sql
- db/seed/seolo_seoul_admin_seed.sql
