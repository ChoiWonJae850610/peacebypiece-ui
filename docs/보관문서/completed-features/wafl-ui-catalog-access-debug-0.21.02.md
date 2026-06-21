# WAFL UI Catalog 접근/Debug Outline 임시 보정 — 0.21.02

## 목적

모바일에서 `/ui` 카탈로그 화면을 직접 확인할 수 있도록, 현재 개발 단계에서는 `NEXT_PUBLIC_APP_RUNTIME_MODE` 값과 관계없이 `/ui`에 접근할 수 있게 한다.

또한 화면 확인을 방해하는 WAFL 공통 컴포넌트 debug outline 분홍색 선을 기본 비활성화한다.

## 적용 내용

- `/ui` runtime gate 조건문은 유지하되 `WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED = false`로 임시 해제
- production 차단을 다시 적용해야 할 때는 `app/ui/page.tsx`의 `WAFL_UI_CATALOG_RUNTIME_GATE_ENABLED` 값을 `true`로 변경
- root body의 `data-wafl-component-debug` 값은 `WAFL_COMPONENT_DEBUG_OUTLINE_ENABLED` 플래그로 제어
- 현재 기본값은 `false`
- 분홍색 outline을 다시 보고 싶을 때는 `app/layout.tsx`의 `WAFL_COMPONENT_DEBUG_OUTLINE_ENABLED` 값을 `true`로 변경

## 주의

이번 패치는 카탈로그 확인 편의만 보정한다. 업무 기능 화면 로직은 변경하지 않는다.
