# WAFL 통계/멤버관리 Direct Style 제거 1차 (0.21.31)

## 목표
- 통계/멤버관리와 관리자 홈에서 남아 있던 직접 radius, stone 색상, legacy card class를 WAFL Foundation 기준으로 줄인다.
- 기능 로직은 변경하지 않고 표시 컴포넌트와 class 조합만 정리한다.

## 적용 범위
- 관리자 완료 검증 패널
- 데이터 연결 점검 패널
- 관리자 홈 workspace card
- 관리자 공통 card/tile/action bar
- `/ui` Direct Style 잔여 점검판

## 정리 기준
- 반복 audit row는 `WaflSurface shape="control"`을 사용한다.
- 안내/다음 범위 박스는 `WaflInfoBox shape="control"`을 사용한다.
- badge/pill 역할은 `AppBadge`를 사용한다.
- 링크 내부 버튼처럼 실제 button을 넣으면 안 되는 곳은 `getWaflButtonClassName`을 span에 적용한다.
- chart dot, calendar range, 실제 원형 의미가 있는 요소는 이번 제거 대상에서 제외한다.

## 다음 정리 대상
- 설정/결제/회사 화면 Direct Style 제거
- public/dev 화면 중 고객에게 노출될 수 있는 화면 정리
- chart/calendar 예외 목록 확정
