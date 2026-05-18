Version :
0.13.86

Summary :
DB full reset 기준과 누적 patch SQL 정리

Description :
0.13.58부터 0.13.70까지의 고객사 초대, 체험 상태, 초대 링크 목록, 온보딩 파일, 거절 상태 관련 patch SQL이 full_reset.sql에 이미 반영되어 있음을 기준으로 개별 migration 파일을 삭제 대상으로 정리했다. full_reset smoke test에는 최근 온보딩/초대/체험 상태 구조의 테이블, 컬럼, 인덱스, seed 검증을 추가했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
- db/migrations/patch_0_13_58_company_invitation_independent_token.sql
- db/migrations/patch_0_13_59_company_trial_period.sql
- db/migrations/patch_0_13_60_invitation_link_list.sql
- db/migrations/patch_0_13_61_company_onboarding_files.sql
- db/migrations/patch_0_13_70_company_rejected_status.sql
