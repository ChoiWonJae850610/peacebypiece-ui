# Pipeline 다운로드 감시 분리 — 0.23.84

## 목적

메인 PowerShell에 혼합돼 있던 다운로드 감시·패치 처리 코드를 책임별 파일로 분리한다. 코드를 watcher에 복사하지 않고 메인과 watcher가 같은 공통 처리 엔진을 사용한다.

## 구성

- `peacebypiece-auto-pipeline.ps1`: 메뉴와 명령 제어
- `download-watcher.ps1`: 감시 주기와 M 키 복귀
- `pipeline-common.ps1`: 환경·설정·경로·로그·공통 기본 함수
- `pipeline-patch-processing.ps1`: commit-meta, 허용 경로/확장자, 임시 다운로드 확장자, ZIP 안정화, 패치 적용, Git/build/archive
- `pipeline.config.psd1`: 환경 설정

## 이번 버전 범위

기존 foreground 감시 동작을 유지한 채 파일 분리만 먼저 수행한다. PID 상태 파일, 백그라운드 시작·종료 토글, 메인 메뉴 재배치는 후속 버전에서 적용한다.

## 중복 방지

commit-meta 파싱과 패치 처리 함수는 `pipeline-patch-processing.ps1`에 한 번만 정의한다. 메인과 watcher는 dot-source로 같은 구현을 불러온다.
