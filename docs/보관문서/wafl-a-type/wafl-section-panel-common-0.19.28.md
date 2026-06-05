# WAFL Section Panel Common Standard 0.19.28

## 목적

고객사 관리자 주요 화면의 본문 섹션을 같은 화면 문법으로 정리한다.

## 기준 구조

- `WaflSectionPanel`
  - 본문 섹션 카드 wrapper
  - theme token 기반 배경, 테두리, radius, shadow, padding
  - `eyebrow`, `title`, `description`, `meta`, `actions`, `children` slot 제공
- `AdminPanelSection`
  - 기존 사용처 호환을 위해 `WaflSectionPanel`을 감싼다.
  - 멤버관리 등 기존 섹션도 같은 header/divider/body 구조를 탄다.

## 0.19.28 적용 범위

- 통계정보 분석 섹션
- 멤버관리 멤버 목록 섹션
- 협력업체관리 업체 목록 섹션
- 저장소관리 휴지통 섹션

## UI 원칙

- 검색/필터/테이블은 섹션 제목 없이 바로 시작하지 않는다.
- 본문 섹션은 `eyebrow → title → description → divider → content` 순서를 따른다.
- 색상, 배경, 테두리, 구분선은 `var(--pbp-*)` theme token을 사용한다.
- 화면별 직접 hero/section 색상 지정은 추가하지 않는다.
