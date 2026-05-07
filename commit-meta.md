Version :
0.9.2227

Summary :
6개월 realistic DB seed SQL 추가

Description :
고객관리자 통계, 협력업체, 작업지시서, 저장소 화면을 실제 DB 데이터 기준으로 테스트하기 위한 realistic seed SQL을 추가했다. 최근 6개월 기준 작업지시서 100개, 협력업체 12개, 발주/자재/외주/메모/첨부 metadata를 생성하며, R2 실제 파일 업로드는 다음 버전의 더미 파일 생성/업로드 스크립트에서 처리한다. APP_VERSION을 0.9.2227로 갱신했다.

수정 파일 목록 :
- lib/constants/app.ts

추가 파일 목록 :
- db/schema/seed_realistic_workorders_0_9_2227.sql
- docs/realistic-db-seed-0.9.2227.md

삭제 파일 목록 :
없음
