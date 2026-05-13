# 0.11.22 관리자 점검 패널 라벨 공통 UI 적용

## 범위

- 관리자 완료 검증 패널의 상태/집계 라벨을 `AdminStatusBadge`로 전환했다.
- 관리자 데이터 연결 점검 패널의 repository mode, 데이터 연결 상태, source type 라벨을 `AdminStatusBadge`로 전환했다.
- 완료 검증 및 데이터 연결 점검 계산 로직은 변경하지 않았다.

## 변경하지 않은 것

- 관리자 완료 검증 summary 산출 기준
- DB 연결 점검 항목 정의
- i18n key 구조
- API, DB schema, 저장/조회 로직

## 확인 항목

- `/admin` 진입 후 관리자 점검 요약을 펼쳤을 때 라벨 tone이 정상 표시되는지 확인한다.
- 완료/점검/차단 라벨이 success/warning/danger tone으로 표시되는지 확인한다.
- 실제 데이터 사용/데이터 연결 준비/안전 표시 보호 라벨이 success/warning/info tone으로 표시되는지 확인한다.
