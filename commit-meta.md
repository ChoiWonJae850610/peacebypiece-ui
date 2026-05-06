Version :
0.9.215

Summary :
권한과 feature flag 체계 설계

Description :
고객사 관리자 권한 설정과 요금제별 통계 노출을 분리하기 위해 기능별 permission code와 feature flag 기준을 코드 상수와 문서로 정리했다. 작업지시서, 워크플로우, 메모, 첨부, 기준정보, 통계, 운영 권한 그룹을 분리하고 Basic/Standard/Growth/Premium/Enterprise feature 정책을 추가했다. 이번 버전은 DB schema, full_reset.sql, API 차단 로직, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/permissions/index.ts
- lib/permissions/permissionPolicy.ts

추가 파일 목록 :
- lib/permissions/featureFlagPolicy.ts
- docs/permission-feature-gate-0.9.215.md

삭제 파일 목록 :
없음
