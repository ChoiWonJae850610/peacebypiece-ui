Version: 0.9.11

Summary: 관리자 UX 2차 정책 모달 및 저장소 상태 기준 정리

Description:
- 협력업체/환경설정 계열 정책 모달의 토글 UI를 공통 StatusToggle 기준으로 맞췄습니다.
- 파일 정책 모달에서 삭제 방식이 즉시삭제일 때 파일 보관 기간 선택을 비활성화했습니다.
- 파일 보관 기간 명칭을 기존 실제 삭제 기간에서 운영자 화면 기준 명칭으로 정리했습니다.
- 저장소 사용량 상태를 정상 / 주의 / 위험 구조로 확장했습니다.
- APP_VERSION을 0.9.11로 동기화했습니다.
- package.json / package-lock.json은 수정하지 않았습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.11로 갱신.
- components/admin/standards/AdminFilePolicySettingsModal.tsx: 파일 정책 모달 토글 스타일 통일, 즉시삭제 시 보관 기간 비활성화, 명칭 정리.
- components/admin/standards/AdminNotificationPolicySettingsModal.tsx: 알림 정책 모달 토글을 공통 StatusToggle 스타일로 통일.
- app/api/admin/files/snapshot/route.ts: 저장소 상태 계산을 정상 / 주의 / 위험 구조로 확장.
- components/admin/files/FileStorageSummary.tsx: 저장소 상태 뱃지와 진행 막대가 정상 / 주의 / 위험에 맞게 표시되도록 수정.
- lib/admin/adminFiles.types.ts: 저장소 상태 tone 타입을 normal / caution / danger로 확장.
- lib/admin/adminFiles.presentation.ts: 파일 정책 표시 문구를 즉시삭제 / 파일 보관 기간 / 용량 상태 기준으로 정리.
- lib/admin/adminDashboard.presentation.ts: 관리자 정책 설명 문구의 용량 기준 명칭을 정리.
- lib/i18n/ko/admin.ts: 파일 정책 i18n 문구를 운영자 화면 기준 명칭으로 정리.
- commit-meta.md: 이번 버전 작업 내역 기록.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
1. 파일 정책 모달
   - 삭제 방식 토글을 버튼형 라벨 토글에서 공통 StatusToggle로 변경했습니다.
   - 휴지통 방식이면 파일 보관 기간 선택이 활성화됩니다.
   - 즉시삭제 방식이면 파일 보관 기간 선택 버튼이 disabled 상태로 전환됩니다.
   - 삭제 방식 라벨은 휴지통 / 즉시삭제로 정리했습니다.

2. 알림 정책 모달
   - 각 알림 항목의 ON/OFF 버튼을 공통 StatusToggle 기준으로 변경했습니다.
   - 사용 / 미사용 텍스트는 유지하되 토글 크기와 스타일을 환경설정 계열과 맞췄습니다.

3. 저장소 상태 기준
   - 기존 normal / warning 구조를 normal / caution / danger 구조로 확장했습니다.
   - 사용량이 설정 기준 이상이면 주의, 100% 이상이면 위험으로 표시합니다.
   - 저장소 요약 카드의 뱃지와 막대 색상도 상태 기준에 맞게 분리했습니다.

4. 명칭 정리
   - 실제 삭제 기간 → 파일 보관 기간
   - 즉시 삭제 → 즉시삭제
   - 용량 경고 기준 → 용량 상태 기준

검증:
- node_modules가 압축파일에 포함되어 있지 않아 npm run build는 이 환경에서 실행할 수 없었습니다.
- package.json / package-lock.json은 수정하지 않았습니다.
- 변경 범위는 관리자 정책 모달, 저장소 상태 표시, i18n/프레젠테이션 문구, 버전 상수로 제한했습니다.

다음 권장 버전:
0.9.12 — 관리자 i18n 정리
