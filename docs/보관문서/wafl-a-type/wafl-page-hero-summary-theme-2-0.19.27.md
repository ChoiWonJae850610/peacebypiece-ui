# WAFL Page Hero / Summary Card 공통화 2차 0.19.27

## 목적

0.19.26에서 추가한 `WaflPageHero`, `AdminSummaryMetricCards`, `WaflNoticeBox` 기준을 고객사 관리자 주요 화면에 더 일관되게 적용한다.

## 적용 범위

- 통계정보
- 멤버관리
- 협력업체관리
- 저장소관리
- 환경설정

## 반영 기준

- Page Hero는 외곽 카드 안에 다시 떠 있는 내부 카드처럼 보이지 않게 한다.
- 협력업체관리와 저장소관리는 기존 이중 카드 느낌을 줄이고, `WaflPageHero`가 화면 상단 카드 역할을 직접 하도록 정리한다.
- 협력업체 요약 카드는 통계정보/멤버관리 요약 카드와 같은 `AdminSummaryMetricCards` standard density 기준으로 맞춘다.
- 환경설정은 `WaflPageHero`와 `WaflFeatureCard` 기준으로 편입한다.
- 최상단 topbar summary는 화면별 단어형 업무 요약을 우선 사용하고, 긴 설명 문장은 fallback으로만 사용한다.
- 모든 배경, border, text, shadow는 `var(--pbp-*)` theme token 기반으로 유지한다.

## 변경하지 않는 것

- DB/API/R2 흐름
- 멤버 초대/승인/권한 저장
- 저장소 삭제/복원/비우기
- 협력업체 등록/수정
- 통계 계산식
- 환경설정 저장 로직
