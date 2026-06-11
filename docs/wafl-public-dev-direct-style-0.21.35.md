# WAFL public/dev Direct Style 1차 정리 (0.21.35)

## 목적

0.21.35는 고객 업무 핵심 화면 정리 이후 남아 있던 public/dev 및 낮은 우선순위 화면의 직접 스타일 조합을 WAFL Foundation 기준으로 낮추는 작업이다.

## 정리 범위

- public 초대 오류 화면
- service paused 화면
- workspace 약관/정책 화면
- dev test console
- /ui Direct Style 점검판

## 적용 기준

- 카드/요약 박스는 `WaflSurface` 또는 `WaflInfoBox` 기준으로 정리한다.
- 링크형 액션은 `WaflLinkButton` 기준으로 정리한다.
- 개발용 테스트 콘솔의 panel/button/select는 WAFL shape/control 기준을 따른다.
- 고객 공개 정책 문서 내부 section은 `WaflSurface shape="control"` 기준으로 정리한다.

## 남긴 예외 후보

- login page의 public hero CTA는 public A-type 스타일과 함께 별도 점검한다.
- date picker/calendar range의 rounded-full은 날짜 범위 표현의 의미가 있어 예외 후보로 유지한다.
- spinner/progress/avatar/dot 계열은 원형 의미가 있으므로 예외 후보로 유지한다.

## 기능 영향

- 저장/조회/권한/상태 변경 로직은 수정하지 않았다.
- dev test context switch API 호출 흐름은 변경하지 않았다.
- public route의 서버 데이터 조회 흐름은 변경하지 않았다.
