Version : 0.16.24
Summary : dead code와 old path 정리 기준 보정
Description : /admin 화면 라우트 전환 이후 남은 old path와 dead code 후보를 분류하는 정리 문서를 추가하고, 현재 참조용 라우팅/테스트/페이지 인벤토리 문서를 /workspace 기준으로 보정했습니다. 시스템 체크포인트의 담당 영역 표기는 admin에서 workspace로 변경했으며, 실제 API 경로, DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- docs/refactoring-rules.md
- docs/routing-architecture.md
- docs/wafl-a-type/18_wafl-a-type-auth-session-policy.md
- docs/wafl-a-type/19_wafl-a-type-release-test-policy.md
- docs/wafl-a-type/20_wafl-a-type-page-inventory.md
- lib/constants/app.ts
- lib/system/systemAccessStabilityCheckpoint.ts
추가 파일 목록 :
- docs/dead-code-old-path-cleanup-0.16.24.md
삭제 파일 목록 :
없음
