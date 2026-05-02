Version : 0.9.95
Base Version : 0.9.94
Target Version : 0.9.95
Summary : DB SQL 운용 정책 문서화
Description : full_reset.sql과 patch SQL의 역할을 분리하고, 기존 DB 업그레이드와 새 DB 초기화 절차가 섞이지 않도록 SQL 운용 정책, 정합성 매트릭스, patch SQL 템플릿, DB 실행 Runbook을 추가했습니다. DB schema와 실제 API/repository 동작은 변경하지 않고 앱 버전만 0.9.95로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- docs/db/sql_file_policy.md
- docs/db/full_reset_patch_consistency_matrix.md
- docs/db/db_execution_runbook.md
- db/patches/README.md
- db/patches/patch_template.sql
삭제 파일 목록 :
- 없음
