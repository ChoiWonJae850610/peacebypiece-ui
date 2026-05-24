Version : 0.16.18
Summary : 원단·부자재 DB/API 연결 1차
Description : 원단·부자재 기준정보를 회사 범위로 조회, 등록, 수정, 삭제할 수 있도록 materials service/repository/API를 추가하고 /workspace/materials 화면을 DB/API 기반으로 전환했습니다. full_reset.sql과 smoke test에 materials 관련 테이블, 인덱스, 검증 항목을 반영했습니다. 작업지시서 상태 연결과 발주 상태 연결은 포함하지 않았습니다.
수정 파일 목록 :
- app/(workspace)/workspace/materials/page.tsx
- db/schema/full_reset.sql
- db/schema/full_reset_smoke_test.sql
- db/schema/materials_schema_draft.sql
- features/materials/MaterialsWorkspacePage.tsx
- lib/constants/adminDb.ts
- lib/constants/app.ts
- lib/materials/constants.ts
추가 파일 목록 :
- app/api/materials/route.ts
- lib/materials/repository.ts
- lib/materials/service.ts
삭제 파일 목록 :
- 없음
