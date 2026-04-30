Version
- 0.9.4 → 0.9.5

Summary
- 관리자 화면의 mock/fallback 노출 문구를 고객사 관리자용 표현으로 정리

Description
- 관리자 DB 점검 패널과 사용자/권한 패널에서 개발자용 용어가 화면에 직접 노출되지 않도록 표시 문구를 정리했다.
- DB/fallback/mock 계열의 내부 상태값은 타입과 내부 판정값으로 유지하고, 화면 표시 라벨은 실제 데이터/안전 표시/샘플 데이터 기준으로 바꿨다.
- 협력업체 관리 섹션의 미사용 repositoryStatus 상태와 mock 저장소 문구를 제거했다.
- APP_VERSION을 0.9.5로 동기화했다.

수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.5로 갱신.
- lib/admin/dbCompletionAudit.ts: DB 점검 항목의 fallback 표시 필드를 alternateDisplay로 바꾸고 화면용 라벨을 고객사 관리자용 표현으로 정리.
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx: 점검 패널의 저장소/안전 표시 문구를 i18n과 고객용 라벨 기준으로 연결.
- lib/i18n/ko/admin.ts: 데이터 연결 점검, 안전 표시, 사용자/권한 패널 문구를 운영 화면 표현으로 정리.
- lib/i18n/en/admin.ts: 동일 i18n 키의 영문 문구 동기화.
- lib/admin/completionAudit.ts: 관리자 완료 점검 문구의 fallback 표현을 안전 표시 표현으로 변경.
- components/admin/PartnerMasterSection.tsx: 화면에 쓰이지 않는 저장소 상태 state와 mock 저장소 문구 제거.

작업 상세 내용
- 기능 변경 없음.
- UI 구조 변경 없음.
- package.json / package-lock.json 수정 없음.
- 관리자 화면에 직접 보일 수 있는 mock/fallback 계열 표현을 1차 정리.
- 아직 repository 내부 타입명과 API payload 상태값에는 mock/fallback 코드가 남아 있으며, 다음 단계에서 실제 제거 가능 범위와 내부 코드명 정리를 별도로 판단해야 함.
