Version : 0.15.46
Summary : 생산구성 조회 numeric 문자열 복원
Description : DB에는 저장된 생산구성 수량·단가·금액이 화면 조회 시 0으로 표시되는 문제를 수정했습니다. PostgreSQL numeric 계열 값이 문자열로 반환되는 경우를 고려해 작업지시서 상세 조회 mapper의 숫자 변환 기준을 number/string/bigint 모두 처리하도록 보강했습니다. 저장 경로, DB schema, API 응답 포맷, R2, 권한, 세션 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- lib/workorder/repository/dbWorkOrderRepository.ts
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts
추가 파일 목록 :
- docs/wafl-a-type/69_wafl-a-type-production-composition-read-numeric.md
삭제 파일 목록 :
- 없음
