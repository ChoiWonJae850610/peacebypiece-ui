Version: 0.9.28

Summary: 환경설정 파일 정책 UX 정리

Description:
- 파일 정책 모달에서 삭제 방식, 휴지통 용량 포함 여부, 보관기간, 기본 용량 한도, 용량 상태 기준을 한 화면에서 관리하도록 정리했다.
- 용량 상태를 정상 / 주의 / 위험 기준으로 미리 확인할 수 있는 표시 영역을 추가했다.
- 저장소 정책 표시에서 실제삭제 중심 문구를 보관기간 중심 문구로 조정했다.
- APP_VERSION을 0.9.28로 동기화했다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.28로 변경했다.
- lib/admin/settings/presentation.ts: 파일 정책 draft 정규화와 용량 상태 preview presentation helper를 추가했다.
- components/admin/standards/AdminFilePolicySettingsModal.tsx: 파일 정책 모달 UX를 삭제 방식, 보관기간, 용량 기준 중심으로 재구성했다.
- lib/admin/adminFiles.presentation.ts: 저장소 정책 표시 문구를 보관기간 기준으로 정리했다.
- lib/i18n/ko/admin.ts: 파일 정책 관련 한국어 i18n 키를 추가했다.
- lib/i18n/en/admin.ts: 파일 정책 관련 영어 i18n 키를 추가했다.

작업 상세 내용:
- 즉시삭제/휴지통 전환 설명을 명확히 분리했다.
- 휴지통 포함 용량 계산 toggle을 정책 모달에 노출했다.
- 휴지통 파일 보관기간 선택 영역을 실제 삭제 후보 산정 기준으로 설명했다.
- 기본 용량 한도와 경고 기준 입력값을 presentation helper에서 안전 범위로 정규화했다.
- 정상 / 주의 / 위험 상태 기준을 warningThresholdPercent 기반으로 표시했다.

검증:
- 현재 압축파일에는 node_modules가 포함되어 있지 않아 로컬 npm run build는 실행 완료하지 못했다.
- 변경 범위 내 TypeScript import/export 및 JSX 구조는 정적으로 점검했다.
