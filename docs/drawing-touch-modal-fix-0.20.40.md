# 0.20.40 직접그리기 모바일/태블릿 터치·닫기 보정

## 목적

작업지시서 디자인 직접그리기가 PC에서는 동작하지만 모바일/태블릿 portrait에서 터치 입력이 되지 않고, 태블릿에서 닫기 후에도 캔버스 상태가 남는 문제를 보정한다.

## 원인 판단

- 모바일/태블릿에서 touch pointer 이벤트를 pointer handler로만 처리하려는 보정이 실제 브라우저 이벤트 순서와 맞지 않았다.
- touch 이벤트 fallback이 PointerEvent 미지원 환경에서만 작동해, iOS/iPadOS/Android의 일반 터치 이벤트가 그리기 로직에 들어가지 못할 수 있었다.
- 태블릿/모바일 drawing modal에서 history guard와 dirty confirm이 close 상태를 복잡하게 만들어, sheet 재진입 시 캔버스가 남아 보일 수 있었다.

## 변경

- 모바일/태블릿에서는 touch 이벤트를 항상 그리기 입력으로 처리한다.
- touch 입력 활성 상태를 별도 ref로 관리한다.
- pointer 이벤트는 desktop mouse/pen 중심으로 사용하고, touch pointer는 touch handler에 맡긴다.
- 모바일/태블릿 drawing modal 닫기는 session/draft/dirty/interaction state를 즉시 정리하고 닫는다.
- PC 직접그리기 흐름은 기존 dirty confirm/history guard 흐름을 유지한다.

## 비변경

- 작업지시서 상태전환 로직 변경 없음
- 권한 로직 변경 없음
- API/DB/R2 변경 없음
- 첨부/메모/휴지통/purge 흐름 변경 없음
