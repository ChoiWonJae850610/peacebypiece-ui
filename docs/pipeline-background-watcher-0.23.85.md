# PowerShell background download watcher — 0.23.85

- watcher는 별도 숨김 PowerShell 프로세스로 실행한다.
- PID, 상태 JSON, heartbeat, watcher 로그를 공통 runtime 경로에 저장한다.
- 메인 메뉴 종료와 watcher 종료는 분리한다.
- 메인과 watcher는 runtime-options JSON을 통해 자동 Build 상태를 공유한다.
- PID 확인 시 가능하면 Win32_Process command line에서 download-watcher.ps1 실행 여부를 검증한다.
- 메뉴 1~5는 watcher, npm dev, 자동 Build, Flush, 개발·테스트 순서다.
