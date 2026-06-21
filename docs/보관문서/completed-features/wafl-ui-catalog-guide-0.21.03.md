# WAFL UI Catalog Guide 0.21.03

## 목적

0.21.03은 `/ui` 카탈로그를 개발자용 샘플 나열 화면에서 모바일에서도 차이를 이해하기 쉬운 사용 설명서형 화면으로 바꾼다.

## 변경 방향

- 컴포넌트를 모양 기준이 아니라 역할 기준으로 묶었다.
- `Start here` 섹션을 추가해 상황별 선택 기준을 먼저 보여준다.
- `Touch actions`, `Containers`, `Inputs`, `Status` 섹션으로 구조를 재배치했다.
- `Wrong / Right` 비교 섹션을 추가해 비슷해 보이는 컴포넌트의 판단 기준을 설명한다.
- 기존 개발자용 import/props 표는 `Spec table`로 뒤쪽에 유지했다.

## 모바일 확인 기준

모바일에서는 아래 순서로 확인한다.

1. Start here: 상황별로 어떤 컴포넌트를 써야 하는지 확인
2. Touch actions: 누르는 요소 구분
3. Containers: 담는 요소 구분
4. Inputs: 입력 요소 구분
5. Status: 상태/라벨/필터 표시 구분
6. Wrong / Right: 헷갈리는 컴포넌트 비교
7. Spec table: 개발자용 import/props 확인

## 접근 제한 상태

`/ui` 접근 제한은 0.21.02에서 모바일 확인을 위해 임시 해제되어 있다. 조건문은 유지되어 있으므로 운영 전에는 `app/ui/page.tsx`의 gate flag를 다시 켜면 된다.

## 기능 영향

기존 업무 화면 로직은 변경하지 않는다. 이번 변경은 `/ui` 카탈로그 화면과 APP_VERSION만 대상으로 한다.
