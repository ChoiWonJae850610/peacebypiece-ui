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
