Version :
0.13.96

Summary :
full reset smoke test 기준 보정

Description :
full_reset.sql에 기본 역할 role_catalog seed를 추가하고, 디자이너 기본 역할 템플릿에서 발주 권한 seed를 제거했다. full_reset_smoke_test.sql은 실제 고객사 seed를 요구하지 않도록 수정해 초대/온보딩/승인 플로우로 고객사 데이터를 생성하는 현재 정책과 맞췄다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
