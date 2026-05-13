Version : 0.11.72
Summary : full_reset 작업지시서 목록 인덱스 반영
Description : 0.11.71에서 추가한 작업지시서 목록 필터/정렬용 spec_sheets 인덱스를 db/schema/full_reset.sql에도 반영했습니다. full reset 후에도 완료건 기본 제외와 상태/정렬 쿼리 최적화 기준이 누락되지 않도록 스키마 기준 파일을 동기화했습니다. 앱 버전을 0.11.72로 갱신했습니다.
수정 파일 목록 :
- db/schema/full_reset.sql
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-full-reset-workorder-list-indexes-0.11.72.md
삭제 파일 목록 :
없음
