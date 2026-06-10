# WAFL UI Catalog Error Fix 0.21.08

## 목적
`/ui` 카탈로그 화면에서 `statusRules is not defined` 런타임 오류를 수정한다.

## 수정 내용
- `app/ui/WaflUiCatalogPage.tsx`에 `statusRules` 상수를 추가했다.
- `StatusSamples` 섹션의 `RuleList`가 참조하는 rules 값이 정상 정의되도록 보정했다.
- `APP_VERSION`을 `0.21.08`로 증가했다.

## 변경 범위
- `/ui` 카탈로그 오류 수정만 수행했다.
- 작업지시서, 발주, 저장소 등 실제 업무 화면 로직은 변경하지 않았다.

## 확인 포인트
- `/ui#containers` 또는 `/ui#status` 접근 시 `statusRules is not defined` 오류가 없어야 한다.
- `StatusSamples` 섹션에 “보여주는 요소 선택 규칙”이 정상 표시되어야 한다.
