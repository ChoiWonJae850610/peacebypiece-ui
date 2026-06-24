# Korean / Unicode Encoding Standard

## 1. 목적

PeaceByPiece/WAFL 저장소의 한글 파일명, 폴더명, 문서 본문, UI 문구와 PowerShell 스크립트가 Git, Windows, Node.js, ZIP 전달본에서 손상되지 않도록 인코딩 기준을 고정한다.

## 2. Canonical 기준

- 일반 소스와 문서는 `UTF-8`을 사용한다.
- Windows PowerShell 5.1에서 직접 실행하는 `.ps1`, `.psm1`, `.psd1`은 `UTF-8 BOM`을 사용한다.
- 줄바꿈은 저장소 기준 `LF`를 사용한다.
- 한글 파일명과 폴더명은 Unicode 이름을 그대로 유지한다.
- 인코딩 문제를 피한다는 이유만으로 한글 경로를 영문으로 임의 변경하지 않는다.
- GitHub에서 정상 표시되는 경로는 로컬 ZIP 해제 도구의 mojibake만 보고 rename하지 않는다.

## 3. 파일 유형별 규칙

| 대상 | 기준 |
| --- | --- |
| Markdown, TXT, JSON, YAML, SQL | UTF-8, LF |
| TypeScript, JavaScript, CSS | UTF-8, LF |
| PowerShell `.ps1/.psm1/.psd1` | UTF-8 BOM, LF |
| CSV | 내부 사용은 UTF-8; Excel 전달용은 별도 export 단계에서 UTF-8 BOM 검토 |
| 이미지, PDF, ZIP, font | binary 취급 |

`.editorconfig`와 `.gitattributes`가 이 기준의 저장소 계약이다.

## 4. 한글 경로 규칙

- Git tracked 경로와 GitHub 표시를 source of truth로 본다.
- Windows 탐색기, PowerShell, Node.js에서 동일한 경로를 확인한다.
- ZIP 생성 시 entry name의 Unicode 값을 보존한다.
- Patch ZIP은 flat 구조를 유지하되 한글 이름을 `__` 경로 치환 규칙 안에서 그대로 보존한다.
- ZIP 해제 결과가 깨져 보여도 GitHub와 `git ls-files`가 정상이라면 저장소 경로를 변경하지 않는다.
- 대량 rename은 실제 Git 경로 손상이 확인되고 링크·import·문서 참조 영향이 조사된 경우에만 수행한다.

## 5. 손상 판정

다음은 확정 오류로 취급한다.

- UTF-8 decode 실패
- Unicode replacement character `U+FFFD` 포함
- 파일명 또는 경로에 `U+FFFD` 포함
- canonical PowerShell 파일에서 UTF-8 BOM 누락
- 동일 경로를 ZIP round-trip한 뒤 이름이 달라짐

다음은 경고 후보이며 자동 복구하지 않는다.

- `Ã`, `Â`, `â€` 등 일반적인 mojibake 조합
- box drawing 문자와 한글이 섞인 비정상 문자열
- CP949/UTF-8 이중 변환으로 의심되는 문장

경고 후보는 원문 근거가 있을 때만 복구한다. 문맥만으로 추측해 덮어쓰지 않는다.

## 6. 복구 절차

1. GitHub 또는 Git history에서 정상 원문을 확인한다.
2. 파일 바이트와 현재 decode 결과를 확인한다.
3. 파일명 변경이면 import, 링크, route, script 참조를 모두 검색한다.
4. 최소 범위만 복구한다.
5. diff에서 한글 외의 내용이 변하지 않았는지 확인한다.
6. Unicode encoding contract를 실행한다.
7. PowerShell 파일이면 Windows PowerShell parser와 실제 메뉴 출력을 확인한다.
8. 전체 소스 ZIP과 Patch ZIP의 한글 경로를 다시 확인한다.

## 7. 금지 사항

- `Get-Content`/`Set-Content`의 기본 인코딩에 의존한 대량 재저장
- 정상 파일 전체를 다른 인코딩으로 일괄 변환
- GitHub에서 정상인 한글 경로를 분석 도구 표시만 보고 rename
- 깨진 문장을 추측으로 복구
- PowerShell BOM 제거
- binary 파일을 text mode로 변환

## 8. 자동 검증

```bash
node tests/unicode-encoding-contract.mjs
node tests/pipeline-powershell-encoding-contract.mjs
```

검증은 generated output, dependency, build output과 binary 파일을 제외하고 tracked source 후보를 검사한다.

## 9. 현재 감사 결과

0.24.21.7 전체 소스 기준으로 검사 가능한 텍스트 파일에서 UTF-8 decode 실패와 `U+FFFD`는 확인되지 않았다. GitHub에서 한글 경로가 정상인 것도 확인됐다. 따라서 이번 기준에서는 확정 손상 파일을 임의 수정하지 않고 재발 방지 계약과 검증을 추가한다.
