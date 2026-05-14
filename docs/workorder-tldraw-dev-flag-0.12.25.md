# 작업지시서 고급 그리기 tldraw 개발 플래그 정식화 (0.12.25)

## 목적

0.12.24 기준 고급 그리기 메뉴는 development runtimeMode에서만 표시되지만, tldraw 패키지를 정식 dependency로 유지하지 않은 상태라 로컬 개발 중 bare dynamic import가 브라우저에서 직접 해석되며 `Failed to resolve module specifier 'tldraw'` 오류가 발생할 수 있었다.

0.12.25에서는 tldraw를 package dependency로 정식 포함하고, 고급 그리기 메뉴는 별도 feature flag가 켜진 development runtimeMode에서만 표시한다.

## 노출 조건

고급 그리기 메뉴는 아래 두 조건을 모두 만족할 때만 표시한다.

```env
NEXT_PUBLIC_APP_RUNTIME_MODE=development
NEXT_PUBLIC_ENABLE_TLDRAW_POC=true
```

- production 또는 env 미설정: 고급 그리기 메뉴 숨김
- development이지만 `NEXT_PUBLIC_ENABLE_TLDRAW_POC` 미설정: 고급 그리기 메뉴 숨김
- development + flag true: 고급 그리기 메뉴 표시

## dependency 정책

`tldraw`는 `package.json` dependencies에 정식 포함한다.

이유:

1. 로컬 개발 중 고급 그리기 테스트를 반복할 수 있다.
2. build/runtime에서 bare module specifier 오류를 줄인다.
3. production에는 메뉴를 노출하지 않되, dependency 설치 상태는 유지한다.

## import 정책

`WorkOrderTldrawDrawingModal`은 정적 top-level import 대신 `import("tldraw")` dynamic import를 사용한다.

- flag가 꺼져 있으면 모달 진입 자체가 차단된다.
- flag가 켜진 개발 환경에서만 tldraw editor를 로드한다.
- `tldraw/tldraw.css`는 Next global CSS 제약 때문에 `app/layout.tsx`에서 전역 import한다.

## 운영 판단

현재 운영 기본 기능은 native canvas 직접 그리기다.

`tldraw` 고급 그리기는 production 라이선스 검토 전까지 개발/실험 기능으로만 취급한다.

## 로컬 확인 순서

```powershell
npm install
npm run build
npm run dev
```

개발 모드에서 고급 그리기를 테스트하려면 `.env.local`에 아래 값을 둔다.

```env
NEXT_PUBLIC_APP_RUNTIME_MODE=development
NEXT_PUBLIC_ENABLE_TLDRAW_POC=true
```

## Vercel 운영 배포 기준

Vercel production에는 위 두 env를 등록하지 않는다.

그 경우 고급 그리기 메뉴는 숨겨지고, 기본 직접 그리기(native canvas)만 표시된다.

## 다음 단계

0.12.26 이후 native canvas에 다음 기능을 순차적으로 추가하는 방향이 현실적이다.

1. 텍스트 삽입
2. 직선/화살표 도구
3. 사각형/원 도구
4. 저장 전 미리보기
5. 캔버스 템플릿
