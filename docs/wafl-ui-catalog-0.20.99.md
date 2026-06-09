# WAFL UI Catalog 0.20.99

## 목적

`/ui` 경로에 WAFL 공통 컴포넌트 카탈로그/스펙 확인 페이지의 1차 구조를 추가한다.

## 접근 조건

`NEXT_PUBLIC_APP_RUNTIME_MODE` 값이 아래 중 하나일 때만 접근을 허용한다.

- `development`
- `dev`
- `local`
- `test`
- `demo`

`production`, 빈 값, 알 수 없는 값은 `notFound()`로 차단한다.

## 0.20.99 범위

- `/ui` 라우트 추가
- runtime mode 접근 제한 유틸 추가
- UI Catalog 기본 layout 생성
- Foundation / Surface / Buttons / Forms / Feedback / Data Display / Navigation / Modal / Workorder Patterns 섹션 뼈대 생성
- 대표 샘플 일부 배치
- 업무 기능 화면 로직은 변경하지 않음

## 이후 버전

0.21.00부터 Button, Badge, Form, Surface, Table, Modal, 실무 패턴 순서로 상세 스펙을 채운다.
