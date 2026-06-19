# Pipeline changelog

## v19.5

- 스크립트를 저장소 `tools/pipeline`으로 이동
- 파일명을 `peacebypiece-auto-pipeline.ps1`로 고정
- 버전, 경로, 실행 옵션을 `pipeline.config.psd1`로 분리
- Neon 기본 DB명에서도 명시적으로 승인한 fingerprint만 Simulator seed/cleanup 허용

## v19.6

- 다운로드 감시 실행 파일을 `download-watcher.ps1`로 분리
- 공통 환경·경로·로그 유틸을 `pipeline-common.ps1`로 분리
- commit-meta 파싱, 임시 확장자 검사, ZIP 안정화, 안전 경로 검사, 패치 적용·Git·빌드·archive 흐름을 `pipeline-patch-processing.ps1`로 이동
- 메인 스크립트와 watcher가 동일한 처리 엔진을 dot-source하여 중복 구현하지 않도록 정리
- 이번 단계에서는 기존 동작을 유지하기 위해 watcher를 foreground로 실행하며, 백그라운드 PID 토글은 후속 단계로 분리


## v19.7 / APP 0.23.85

- 다운로드 watcher를 별도 숨김 PowerShell 프로세스로 실행하는 PID ON/OFF 토글 추가
- watcher PID, 상태 JSON, heartbeat, 로그 파일 추가
- 죽은 PID와 watcher가 아닌 PID 상태 자동 정리
- 자동 Build 옵션을 runtime JSON에 저장하여 메인과 watcher가 동일 상태 사용
- 메인 종료 후 watcher와 npm dev 상태 유지
- 메인 메뉴를 Download watcher, npm dev, 자동 Build, Flush, 개발·테스트 순서로 재배치
