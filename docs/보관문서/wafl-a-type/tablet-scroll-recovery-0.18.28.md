# 0.18.28 Tablet scroll recovery

## 목적

0.18.27 이후 Galaxy Tab에서 관리자 화면 세로/가로 스크롤이 모두 막히는 문제를 먼저 복구한다.

## 적용 원칙

- 태블릿 이하에서는 `main` 자체를 별도 스크롤 컨테이너로 만들지 않는다.
- Android Chrome/Samsung Internet에서 `overflow-y-auto`와 `dvh` 조합이 중첩되지 않도록 한다.
- 태블릿 이하에서는 브라우저 document/body의 자연 스크롤을 우선한다.
- 2xl 이상 PC에서만 고정 viewport/내부 패널 스크롤을 유지한다.

## 변경 범위

- `WorkspaceShell`의 태블릿 이하 `overflow-y-auto`, `min-h-full`, `flex-1`, `min-h-0` 의존을 완화했다.
- `2xl` 이상 PC 레이아웃 기준은 유지했다.

## 비변경

- 저장소, 협력업체, 멤버관리의 데이터/API 흐름은 변경하지 않았다.
- DB/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았다.
