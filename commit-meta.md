Version: 0.9.25

Summary:
관리자 화면 i18n 누락 문구 보완 및 APP_VERSION 0.9.25 동기화

Description:
히스토리, 저장소, 협력업체, 환경설정, 대시보드 범위에서 0.9.24 기준 미비된 관리자 i18n 키를 보완했다. 저장소 탭 그룹, 저장소 사용 현황 제목/설명, 협력업체 저장 실패 문구를 ko/en i18n에 추가했고, 일부 직접 노출 문구를 i18n 또는 i18n 상수 기준으로 정리했다. package.json 및 package-lock.json은 수정하지 않았다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.25로 동기화.
- lib/i18n/ko/admin.ts: 저장소 탭/요약 문구와 협력업체 저장 실패 문구 i18n 키 추가.
- lib/i18n/en/admin.ts: ko/admin.ts와 대응되는 영문 i18n 키 추가.
- components/admin/common/AdminTable.tsx: 로딩 기본 문구를 i18n 상수 기준으로 연결.
- components/admin/notification/AdminNotificationSettingsSection.tsx: 알림 사용/미사용 토글 문구를 i18n hook 기준으로 연결.
- components/admin/PartnerMasterSection.tsx: 협력업체 저장 실패 문구를 partnerMaster i18n 문구로 연결.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 0.9.24 압축파일을 기준으로 다시 작업했다.
- 이전 응답에서 파일 생성이 완료되지 않았던 0.9.25 작업을 현재 첨부 zip 기준으로 재수행했다.
- 저장소 관리 화면에서 사용 중인 filesPage.tabGroupLabel, filesSummary.title, filesSummary.description 키를 ko/en에 추가했다.
- 협력업체 저장 실패 문구를 하드코딩 문자열 대신 partnerMaster.form.saveFailed로 연결했다.
- 알림 설정 섹션의 사용/미사용 토글 표시를 notificationSection.toggleOn/toggleOff 기준으로 연결했다.
- npm run build는 node_modules가 없는 압축파일 환경에서 next 실행 파일을 찾을 수 없어 완료하지 못했다.
