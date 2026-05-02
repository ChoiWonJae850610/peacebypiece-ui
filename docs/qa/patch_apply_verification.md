# Patch Apply Verification Guide

Version: 0.9.96

## 목적

ChatGPT가 제공한 patch 파일을 로컬 프로젝트에 적용한 뒤, 실제 반영 여부를 사람이 빠르게 검증하기 위한 기준이다.

## 파일 적용 확인

commit-meta.md 기준으로 확인한다.

```text
Version :
Base Version :
Target Version :
수정 파일 목록 :
추가 파일 목록 :
삭제 파일 목록 :
```

체크:

```text
[ ] 수정 파일이 모두 존재한다.
[ ] 추가 파일이 모두 존재한다.
[ ] 삭제 파일이 실제 삭제되었거나 삭제 없음으로 표시되어 있다.
[ ] 파일명 `__`가 실제 경로 `/`로 정상 변환되었다.
[ ] 위험 확장자 `.txt` 제공 파일은 필요한 경우 실제 확장자로 복구했다.
```

## 버전 확인

```bash
git grep -n "APP_VERSION" lib/constants/app.ts
```

기대:

```text
export const APP_VERSION = "0.9.96";
```

## 금지 파일 확인

```bash
git status --short package.json package-lock.json .env.local
```

기대:

```text
출력 없음
```

## 수정 파일 수 확인

```bash
git status --short
```

확인:

```text
[ ] commit-meta.md의 수정/추가/삭제 목록과 실제 git status가 맞는다.
[ ] 의도하지 않은 파일이 없다.
[ ] build output, .next, node_modules가 포함되지 않았다.
```

## build

```bash
npm run build
```

통과 후 다음을 진행한다.

## commit message

commit-meta.md의 Summary를 commit 제목으로 사용한다.

예:

```text
build smoke 체크리스트 문서화
```

Description은 commit body로 사용한다.

## push 후 repo-state 확인

push 후 repo-state에 아래 값이 있어야 한다.

```text
Push Completed: true
Branch: master
Local HEAD Commit = Origin Master Commit
Status Short: clean
APP_VERSION: export const APP_VERSION = "0.9.96";
```

## 문제가 있으면

문제 유형별로 다음 요청을 사용한다.

```text
0.9.96 적용 후 npm run build 에러가 난다.
repo-state와 에러 캡처 기준으로 0.9.97 빌드 수정 작업해줘.
```

또는:

```text
0.9.96 적용 후 commit-meta.md 파일 목록과 실제 변경 파일 목록이 다르다.
0.9.97에서 commit-meta.md 정합성만 수정해줘.
```
