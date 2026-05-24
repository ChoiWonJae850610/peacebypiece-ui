Version : 0.16.11
Summary : 작업지시서 capability 판단 중앙화 1차
Description : 작업지시서 생성, 수정, 삭제, 복원, 상태 변경 권한 판단을 lib/permissions/workorderCapabilities.ts로 중앙화하고, 작업지시서 derived state가 해당 capability state를 사용하도록 정리했습니다. 기존 권한 정책과 화면 동작은 유지했으며 DB schema, package.json, package-lock.json 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
- lib/permissions/index.ts
추가 파일 목록 :
- lib/permissions/workorderCapabilities.ts
삭제 파일 목록 :
- 없음
