# UI Section/ListRow 적용 정리 — 0.18.13

## 목적

AppSection과 AppListRow를 단순 래퍼가 아니라 화면별 섹션/목록 UI의 공통 기준으로 사용할 수 있게 정리한다.

## 반영 내용

- AppSection에 `variant`, `padding`, `headerClassName`을 추가했다.
- AppSection은 AppCard의 variant/padding 체계를 그대로 위임한다.
- AppListRow에 `as`, `density`, `variant`를 추가했다.
- AppListRow를 button 형태로도 사용할 수 있게 했다.
- 원단·부자재 발주서 목록 row를 AppListRow로 전환했다.

## 적용 원칙

- 목록 row의 제목/설명/메타/우측 배지는 AppListRow 슬롯으로 분리한다.
- 기존 선택 상태, hover, border 톤은 AppListRow variant에서 관리한다.
- 화면별 도메인 로직은 변경하지 않는다.
- DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않는다.
