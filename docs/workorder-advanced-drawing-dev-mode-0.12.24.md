# 작업지시서 고급 그리기 개발 모드 제한 정리 (0.12.24)

## 목적

0.12.23에서 추가한 tldraw 기반 고급 그리기는 tablet/PC 테스트 결과 사용성은 좋았지만, production 배포와 라이선스 검토가 필요하다. 따라서 0.12.24에서는 고급 그리기를 development runtimeMode에서만 노출하도록 제한한다.

## 적용 기준

- `NEXT_PUBLIC_APP_RUNTIME_MODE=development`
  - 디자인 첨부 메뉴에 `고급 그리기` 표시
  - tldraw 기반 고급 그리기 PoC 모달 테스트 가능
- 환경변수 미설정 또는 production
  - `고급 그리기` 숨김
  - 기본 `직접 그리기` native canvas만 표시

## build 오류 보정

0.12.23 build 실패 원인은 tldraw 패키지가 설치되지 않은 상태에서 아래 import가 production build에 포함되었기 때문이다.

- `import { Tldraw } from "tldraw"`
- `import "tldraw/tldraw.css"`

0.12.24에서는 정적 import를 제거했다. 고급 그리기 모달은 development runtimeMode에서만 접근되며, tldraw 모듈은 optional dynamic import로만 시도한다.

## package 정책

이번 버전에서는 `package.json`에서 tldraw dependency를 제거했다. 일반 build는 추가 설치 없이 통과하는 구조를 우선한다.

고급 그리기 PoC를 로컬에서 다시 테스트하려면 별도 실험 단계에서 아래 명령으로 설치한 뒤 development runtimeMode에서 확인한다.

```powershell
npm install tldraw
```

단, 이 설치는 production 기능 확정 전까지 실험용으로만 취급한다.

## native canvas 강화 방향

운영 기본 기능은 native canvas를 유지한다. 다음 단계에서 우선 추가할 만한 기능은 다음 순서가 적절하다.

1. 텍스트 삽입
2. 직선 / 화살표
3. 사각형 / 원
4. 저장 전 미리보기
5. 배경 템플릿 또는 간단한 가이드라인

선택/이동/확대/축소/객체 재편집까지 native canvas에 직접 구현하면 작은 편집기 엔진을 만드는 수준이 되므로, 실제 디자이너 테스트 후 필요성이 확인될 때 별도 범위로 분리한다.
