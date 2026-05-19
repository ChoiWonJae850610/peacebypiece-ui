Version :
0.13.97

Summary :
full_reset smoke test 권한 seed 검증 기준 보정

Description :
full_reset_smoke_test.sql의 permission_catalog member/access 검증이 현재 권한 그룹 구조보다 좁은 그룹만 집계해 실패하던 문제를 수정했다. workspace와 멤버 업무에서 실제 사용하는 비시스템 권한 그룹 전체를 기준으로 seed count를 검증하도록 보정하고 full_reset 기준 버전을 0.13.97로 갱신했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
