# 패치 자동화 삭제 안전장치 기준 (0.19.94.4)

## 목적

0.19.94.2 적용 중 `playwright-report/` 같은 폴더 삭제가 PowerShell 확인 프롬프트를 발생시킨 사례를 기준으로, 패치 zip의 `삭제 파일 목록` 작성 원칙과 패치 자동화 스크립트 보강 방향을 정리한다. 이번 버전은 프로젝트 기능 코드, DB schema, API route, R2 flow를 수정하지 않는다.

## 기준 상태

- 기준 버전: 0.19.94.3
- repo-state: clean / origin master 동기화 / push 완료
- 프로젝트 zip 내부에서 `*.ps1` 패치 자동화 스크립트는 확인되지 않았다.
- 따라서 이번 패치는 외부 패치 스크립트를 직접 수정하지 않고, 프로젝트 내부 문서와 README 기준만 보강한다.

## 1. 이번 이슈 원인

0.19.94.2의 최초 삭제 목록에는 실제 파일뿐 아니라 다음과 같은 폴더 경로가 포함되었다.

```text
playwright-report/
test-results/
app/(admin)/admin/files/
app/system/audit-logs/
app/invite/member/[token]/
```

이 중 `playwright-report/`와 `test-results/`는 삭제해도 되는 생성 산출물이지만, PowerShell에서 폴더를 `Remove-Item` 할 때 `-Recurse` 없이 처리하면 하위 항목 삭제 여부 확인 프롬프트가 발생한다. 또한 `app/`, `lib/`, `components/` 같은 코드 경로의 폴더를 삭제 목록에 넣으면 route group, 동적 route, 빈 폴더 정리 여부가 섞여 위험하다.

## 2. 패치 zip 삭제 목록 원칙

### 허용

`commit-meta.md`의 `삭제 파일 목록 :`에는 원칙적으로 실제 파일만 넣는다.

```text
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
```

### 제한적 허용

폴더 삭제는 패치 적용 단계가 아니라 별도 clean 단계로 분리한다. 허용 대상은 생성 산출물 allowlist에 한정한다.

```text
playwright-report/
test-results/
.next/
.tmp/
coverage/
logs/
```

### 기본 차단

다음 경로 하위 폴더 단위 삭제는 기본 차단한다.

```text
app/
components/
lib/
db/
scripts/
features/
public/
cloudflare/
tests/
```

특히 Next.js route group과 dynamic segment가 포함된 경로는 폴더 삭제 목록에 넣지 않는다.

```text
app/(admin)/...
app/invite/member/[token]/...
app/system/...
```

## 3. 패치 자동화 스크립트 보강 권장안

외부 PowerShell 패치 스크립트에는 다음 방어 로직을 넣는 것이 좋다.

```powershell
$GeneratedFolderAllowList = @(
  'playwright-report',
  'test-results',
  '.next',
  '.tmp',
  'coverage',
  'logs'
)

$ProtectedFolderPrefixes = @(
  'app/',
  'components/',
  'lib/',
  'db/',
  'scripts/',
  'features/',
  'public/',
  'cloudflare/',
  'tests/'
)
```

권장 처리 순서는 다음과 같다.

1. 삭제 목록 항목을 파일/폴더로 분리한다.
2. 파일은 기존 방식대로 삭제한다.
3. 폴더는 allowlist와 정확히 일치하거나 allowlist 하위일 때만 삭제한다.
4. 보호 prefix 하위 폴더 삭제는 중단하고 사용자에게 경고한다.
5. 허용 폴더 삭제 시에는 `Remove-Item -Recurse -Force`를 사용해 확인 프롬프트가 뜨지 않도록 한다.
6. 존재하지 않는 삭제 경로는 경고만 남기고 실패 처리하지 않는다.

## 4. commit-meta.md 운용 기준

현재 패치 zip에는 `commit-meta.md`가 반드시 필요하다. 다만 패치 적용 후 repo root에 계속 남는 구조는 장기적으로 불필요하다.

권장 개선 방향은 다음과 같다.

```text
- 패치 zip 내부 commit-meta.md는 metadata로 읽는다.
- 적용 후 repo root에 commit-meta.md를 남기지 않는다.
- 커밋 메시지 생성에는 metadata 내용을 사용한다.
- repo에 남길 변경 이력은 docs/ 또는 별도 changelog 문서에 기록한다.
```

단, 현재 자동화 스크립트가 commit-meta.md를 적용·커밋 흐름에 사용하고 있으므로 이 변경은 외부 스크립트 수정 시점에 별도로 처리한다.

## 5. 앞으로의 패치 작성 기준

- `삭제 파일 목록 :` 아래에는 실제 프로젝트 파일만 적는다.
- 빈 폴더 정리는 문서화만 하고 패치 삭제 목록에 넣지 않는다.
- 생성 산출물 폴더 삭제는 외부 clean 단계로 분리한다.
- 테스트 불가 기간에는 기능 코드보다 문서/README/gitignore/명백한 산출물 정리만 우선한다.

## 6. 이번 패치의 변경 범위

- `README.md`에 0.19.94.4 패치 자동화 삭제 안전장치 기준 추가
- `docs/README.md`에 0.19.94.4 문서 링크 추가
- `docs/patch-automation-delete-safety-0.19.94.4.md` 신규 추가
- `lib/constants/version.ts` 버전 갱신
- 기능 코드, DB schema, API route, R2 flow 변경 없음

ChatGPT/container에서는 `npm run build`를 실행하지 않았다.
