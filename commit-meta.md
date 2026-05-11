Version : 0.10.48
Summary : 시스템 기준정보 seed 보강 SQL과 점검 기준 정리
Description : 시스템 기준정보가 DB 결과만 사용하도록 전환된 이후 기존 개발 DB를 유지하면서 부족한 seed를 보강할 수 있는 0.10.48 seed refresh SQL을 추가했습니다. seed 상태 화면에는 기준정보별 최소 활성 기준과 실행할 SQL 파일명을 표시하고, 시스템 기준정보 설계 화면의 DB-only 안내 문구를 seed 보강 흐름에 맞게 갱신했습니다. DB schema, 시스템 기준정보 CRUD, 고객관리자 기준정보 저장 로직, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/standards/seedStatusRepository.ts
- components/system/standards/SystemStandardsSeedStatusPage.tsx
- components/system/standards/SystemStandardsDesignPage.tsx

추가 파일 목록 :
- db/schema/patch_0_10_48_system_standards_seed_refresh.sql
- docs/system-standards-seed-refresh-0.10.48.md

삭제 파일 목록 :
- 없음
