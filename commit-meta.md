Version :
0.11.45.1

Summary :
작업지시서 DB 드라이버 로딩 긴급 보정

Description :
작업지시서 화면에서 DB 드라이버 없음 상태로 실제 DB 데이터가 로딩되지 않는 문제를 보정하기 위해 pg Pool을 서버 DB client에서 명시 import하도록 변경했다. pg 타입 선언을 최소 추가하고 APP_VERSION을 긴급 보정 버전으로 갱신했다.

수정 파일 목록 :
- lib/db/client.ts
- lib/constants/app.ts

추가 파일 목록 :
- types/pg.d.ts
- docs/workorder-db-driver-hotfix-0.11.45.1.md

삭제 파일 목록 :
없음
