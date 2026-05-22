Version :
0.15.67

Summary :
full reset smoke test 인덱스 기대값 보정

Description :
생산구성 현재값 테이블 정리 후 full_reset smoke test가 예전 orders 인덱스명을 검사하던 문제를 수정했다. smoke test의 orders 인덱스 기대값을 현재 full_reset.sql에서 생성하는 orders_company_factory_idx와 일치시키고, 에러 메시지를 필수 인덱스 누락 표현으로 정리했다. 앱 버전도 0.15.67로 갱신했다.

수정 파일 목록 :
- db/schema/full_reset_smoke_test.sql
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
