Version : 0.10.40
Summary : 시스템관리자 외주공정 유형 CRUD 1차 연결
Description : 시스템관리자 외주공정 유형 관리 화면에서 system_outsourcing_process_standards 원장을 조회, 추가, 수정, 활성/비활성 전환할 수 있도록 1차 CRUD API와 화면을 연결했습니다. 외주공정 유형 추가와 수정은 감사 로그에 standard.process_created, standard.process_updated로 기록됩니다. 고객사별 외주공정 사용 여부 저장, 고객관리자 화면 연결, DB schema는 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/standards/systemProcessStandards.ts
- components/system/standards/SystemProcessStandardsPage.tsx

추가 파일 목록 :
- app/api/system/standards/processes/route.ts
- lib/system/standards/processStandardsRepository.ts
- lib/system/standards/api/processRouteHandlers.ts
- docs/system-process-standards-crud-0.10.40.md

삭제 파일 목록 :
- 없음
