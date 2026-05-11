Version : 0.10.38
Summary : 시스템 기준정보 DB schema 설계
Description : 시스템 기준정보 관리를 위한 DB schema를 추가했습니다. 단위 표준과 외주공정 유형은 시스템 표준 원장과 고객사별 사용 여부 테이블로 분리하고, 생산품 유형은 신규 고객사 기본 템플릿 테이블로 설계했습니다. full_reset, smoke test, patch SQL과 시스템 기준정보 설계 화면 문구를 갱신했으며 실제 CRUD, 고객관리자 저장 로직, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- components/system/standards/SystemStandardsDesignPage.tsx
- lib/system/systemStandardsDesign.ts

추가 파일 목록 :
- db/schema/patch_0_10_38_system_standards_schema.sql
- docs/system-standards-db-schema-0.10.38.md

삭제 파일 목록 :
- 없음
