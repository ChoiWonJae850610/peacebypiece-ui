# WAFL Settings Common UI 0.19.43

## 목표

고객사 관리자 환경설정 화면을 WAFL 공통 UI 기준으로 정리한다.

## 적용 기준

- 화면 상단은 `WaflPageHero`를 유지한다.
- 주요 메뉴 카드는 `WaflFeatureCard`를 유지한다.
- 본문 섹션은 `WaflSectionPanel`을 기준으로 통일한다.
- 회사 정보, 요금제, 약관, 개발 건의 내부 항목은 `WaflSettingCard`를 기준으로 표시한다.
- 안내 문구는 `WaflNoticeBox`를 사용한다.

## 제외

- 회사 정보 변경 요청 API 구조 변경 없음
- 요금제/결제 실제 연동 없음
- 기준정보 설정 기능 변경 없음
- DB/R2/작업지시서/저장소 흐름 변경 없음
