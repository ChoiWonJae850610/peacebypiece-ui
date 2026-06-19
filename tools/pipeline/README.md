# PeaceByPiece Auto Pipeline

## 실행

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\pipeline\peacebypiece-auto-pipeline.ps1
```

설정은 `pipeline.config.psd1`에서 관리합니다. DB URL, 비밀번호, R2 key, token 같은 비밀값은 이 파일에 넣지 않습니다.

## 프로젝트 루트

`Paths.ProjectDir`가 비어 있으면 스크립트 위치(`tools/pipeline`)에서 두 단계 위의 프로젝트 루트를 자동 사용합니다.

## Simulator DB 승인

`Simulator.ApprovedDbFingerprint`는 DB URL의 host/database 조합을 해시한 식별값입니다. Seed와 cleanup은 현재 연결 대상의 fingerprint가 이 값과 정확히 일치할 때만 실행됩니다.

## 스크립트 구성

- `peacebypiece-auto-pipeline.ps1`: 메인 메뉴, npm dev/build 토글, 개발·테스트 메뉴
- `download-watcher.ps1`: 다운로드 폴더 감시 루프
- `pipeline-common.ps1`: 공통 설정 로드, 경로, 로그 및 기본 유틸
- `pipeline-patch-processing.ps1`: commit-meta 파싱, 다운로드 완료 판별, ZIP/경로 검증, 패치 적용, Git/build/archive 처리
- `pipeline.config.psd1`: 사용자 환경 경로와 실행 옵션

현재 `1. Download 폴더 감시 시작`은 별도 watcher 스크립트를 같은 콘솔에서 foreground로 실행합니다. 감시 중 `M`을 누르면 메인 메뉴로 돌아갑니다. 백그라운드 PID 기반 ON/OFF 토글은 다음 단계에서 적용합니다.
