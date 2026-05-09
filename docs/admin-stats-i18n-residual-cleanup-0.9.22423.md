# 0.9.22423 — 관리자 통계 화면 i18n 잔여 문구 정리

## 목표

0.9.22420~0.9.22422에서 도입한 i18n terms/glossary 구조 이후, 관리자 통계 화면에 남아 있던 문장형 하드코딩과 한국어 기본 표시값을 정리한다.

## 반영 내용

- `/admin/dashboard`의 기간 분석, 누적 요약, 리오더 TOP5, 생산품 유형, 업체 성과, 납기/검수 지표 문구를 `dashboardPage` dictionary 기준으로 이동했다.
- 직접 기간 선택 검증 메시지를 dictionary 기준으로 변경했다.
- 생산품 유형 depth label, drilldown 제목, empty state를 dictionary 기준으로 변경했다.
- 공장 성과 tooltip의 납기 지연/검수 후보 설명을 dictionary 기준으로 변경했다.
- `준비중`, `MB 사용` 같은 표시값도 dictionary key를 통하도록 정리했다.
- 문장 전체를 terms 단어 조립식으로 강제하지 않고, 화면 문장 구조는 locale별 dictionary에서 관리하도록 유지했다.

## 보류

- DB에 저장된 사용자 입력 값, 공장명, 카테고리명, 작업명은 자동 번역하지 않는다.
- 통계 데이터의 raw label 번역은 기존 `translateStatsLabel()` mapping 기준을 유지한다.
- 영어 locale 새로고침 직후 짧은 한국어 flash는 SSR initialLocale 구조 이슈로 별도 보류한다.
