Version :
0.15.71

Summary :
생산구성 현재값 테이블 잔존 컬럼 참조 정리

Description :
orders 현재값 테이블에서 제거된 is_active와 deleted_at 조건이 통계 및 운영 대시보드 조회 SQL에 남아 있던 부분을 제거했다. full_reset smoke test에는 생산구성 현재값 테이블의 legacy 컬럼 잔존 여부 검사를 추가했다.

수정 파일 목록 :
- lib/admin/adminOperations.repository.ts
- lib/admin/adminStats.repository.ts
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
