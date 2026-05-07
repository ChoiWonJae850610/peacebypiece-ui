# 0.9.22281 — R2 demo upload unsupported/missing file skip 처리

## 목적

0.9.2228의 R2 demo upload 스크립트는 realistic attachment metadata 중 ZIP 파일이 포함되면 Worker 파일 정책에서 `WORKER_FILE_POLICY_REJECTED`가 발생하고 업로드가 중단될 수 있었다.

이번 버전에서는 small preset을 안정적으로 검증하기 위해 Worker 정책상 안전한 파일만 기본 업로드 대상으로 삼고, 정책 거부/로컬 파일 누락은 전체 실행 중단이 아니라 skip 처리한다.

## 변경 내용

- small/medium/large preset 선택 대상에서 지원하지 않는 파일 형식을 제외한다.
- 기본 지원 MIME/type은 아래로 제한한다.
  - image/png
  - image/jpeg
  - application/pdf
  - text/plain
- 기본 지원 확장자는 아래로 제한한다.
  - .png
  - .jpg
  - .jpeg
  - .pdf
  - .txt
- `.zip` 파일은 현재 Worker 정책 테스트 범위에서 제외한다.
- 업로드 중 `WORKER_FILE_POLICY_REJECTED`가 발생하면 skip 처리하고 계속 진행한다.
- 로컬 더미 파일이 없으면 `ENOENT`로 중단하지 않고 `SKIP:MISSING`으로 기록한다.
- 업로드 결과에 uploaded / skippedUnsupported / skippedMissing / skippedWorkerPolicy / failed 개수를 표시한다.
- verify도 실패 항목을 누적한 뒤 결과를 표시한다.

## 실행 순서

```powershell
cd C:\CWJ_Project\peacebypiece-2.0

Remove-Item -Recurse -Force .\.tmp\r2-demo-files -ErrorAction SilentlyContinue

node .\scripts\seed-r2-demo-files.mjs --preset=small --mode=plan
node .\scripts\seed-r2-demo-files.mjs --preset=small --mode=generate
node .\scripts\seed-r2-demo-files.mjs --preset=small --mode=upload --confirm-upload
node .\scripts\seed-r2-demo-files.mjs --preset=small --mode=verify
```

## 기대 로그

정상적으로 진행되면 업로드 마지막에 아래와 유사한 로그가 표시된다.

```text
[INFO] upload result: uploaded=..., skippedUnsupported=..., skippedMissing=0, skippedWorkerPolicy=0, failed=0
```

`failed=0`이면 small preset 업로드 흐름은 통과한 것으로 본다.

## ZIP 테스트 정책

ZIP은 지금 small preset의 기본 업로드 대상에서 제외한다. ZIP 업로드 테스트는 Worker 파일 정책에서 `application/zip`을 명시적으로 허용한 뒤 별도 preset 또는 별도 옵션으로 다루는 것이 안전하다.
