# 전체 smoke QA 3차 0.20.09

## 목적

`0.19.95`부터 `0.20.08`까지 이어진 회사 파일, 정책 재동의, 요금제/저장공간, 저장소 사용량 제한 작업 묶음의 자동테스트 기준을 정리한다. 이 문서는 기능 코드를 추가하지 않고 QA 기준과 다음 구현 진입 조건을 고정한다.

## 기준 버전

- 기준 원본: `0.20.08`
- 결과 버전: `0.20.09`
- 검증 범위: Playwright E2E, DB/API smoke, 로컬 build 확인 대기

## 자동테스트 결과

### Playwright E2E

사용자 로컬에서 `cmd.exe /d /c "chcp 65001 > nul & npm run test:e2e"` 기준으로 실행한 결과, 6개 테스트가 모두 통과했다.

검증된 주요 영역:

- 공개 로그인 진입
- 개인 설정 언어 전환 UI 숨김
- 정책/약관 화면 렌더링과 재동의 저장 mock
- 환경설정의 정책 진입점과 요금제/저장공간 UI mock
- 정책 재동의 대기 상태 업무 화면 차단
- 상단바 로그아웃 액션

### DB/API smoke

사용자 로컬에서 `cmd.exe /d /c "chcp 65001 > nul & npm run test:smoke:db-api"` 기준으로 실행한 결과, 17개 smoke contract가 모두 통과했다.

검증된 주요 영역:

- 핵심 테이블 schema contract
- 멤버 상태/탈퇴 lifecycle
- 고객사 승인/반려 contract
- 정책 동의/재동의 contract
- 협력업체 업체명/연락처 중복 기준
- 회사 파일 등록/교체/검토 상태 contract
- 회사 구독 상태/저장공간/멤버 제한 contract

### Build

ChatGPT/container에서는 `npm run build`를 실행하지 않는다. 로컬 릴리스 후보 판단 전에는 아래 명령으로 별도 확인한다.

```powershell
Push-Location "C:\CWJ_Project\peacebypiece-2.0"
cmd.exe /d /c "chcp 65001 > nul & npm run build"
Pop-Location
```

## Windows 수동 테스트 표준 명령

PowerShell에서 `npm run test:e2e`를 직접 실행하면 `cmd.exe /d /c` 기반 자동화 스크립트와 실행 조건이 달라질 수 있다. 수동 테스트도 아래 방식으로 통일한다.

```powershell
Push-Location "C:\CWJ_Project\peacebypiece-2.0"
cmd.exe /d /c "chcp 65001 > nul & npm run test:e2e"
cmd.exe /d /c "chcp 65001 > nul & npm run test:smoke:db-api"
Pop-Location
```

`.next` 전체 삭제는 시간이 오래 걸리므로 기본 정리 절차에 포함하지 않는다. 서버 재사용 문제가 의심될 때만 3000번 포트 프로세스를 종료한다.

## 현재 통과 기준

`0.20.08` 적용 후 사용자 로컬 자동테스트 기준으로 다음 상태를 확보했다.

- E2E: 통과
- DB/API smoke: 통과
- build: 별도 로컬 확인 필요

## 다음 작업 진입 기준

`0.20.10`부터는 제품화 마무리 QA와 실제 화면 단위 점검으로 넘어간다. 우선순위는 다음과 같다.

1. `npm run build` 로컬 통과 확인
2. 환경설정 > 회사 정보 > 회사 파일 업로드 실제 동작 확인
3. 환경설정 > 요금제·저장공간 실제 데이터 표시 확인
4. 정책 재동의 차단/해제 실제 흐름 확인
5. 시스템관리자 회사 파일 검토 화면 실제 데이터 확인

## 변경 범위

이번 버전은 문서와 버전만 변경한다. 다음 흐름은 변경하지 않는다.

- DB schema
- API route
- R2 업로드/다운로드 Worker
- 첨부/디자인/메모
- 휴지통/복원/purge
- 권한/역할 로직
