Version :
0.15.72

Summary :
생산구성 현재값 테이블 조인 기준과 회사 범위 조회 보정

Description :
작업지시서 상세 생산구성 row 조회와 목록 count 조회를 company_id와 spec_sheet_id 기준으로 보강했다. full_reset.sql에는 현재 문자열 snapshot 구조와 다음 partner 조인 전환을 위한 인덱스를 추가했고, smoke test에도 해당 인덱스 검사를 반영했다. 생산구성 조인 기준 점검 문서를 추가했다.

수정 파일 목록 :
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts

추가 파일 목록 :
- docs/wafl-a-type/90_wafl-a-type-production-join-audit.md

삭제 파일 목록 :
없음
