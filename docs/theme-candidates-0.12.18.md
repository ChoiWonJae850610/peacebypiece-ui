# PeaceByPiece theme 후보 정리 — 0.12.18

## 목적

0.12.18의 목적은 기존 `default-light`, `beige-atelier`, `cold-winter`만으로는 확인하기 어려운 대비와 브랜드 accent 확장성을 점검할 수 있도록 후보 테마를 추가하는 것이다.

이번 버전은 DB schema, 인증, 사용자 설정 저장 방식은 변경하지 않는다. 개인 설정은 계속 `localStorage` 기반이며, 로그인 도입 후 DB 저장 구조는 `docs/personal-settings-db-design-0.12.17.md` 기준으로 검토한다.

## 유지 테마

### default-light

- 기본 라이트 테마
- `app/globals.css :root` fallback과 동기화해야 하는 기준값
- 지나치게 개성이 강하지 않은 기본 업무 화면용

### beige-atelier

- 따뜻한 베이지/브라운 계열
- 샘플실, 디자인, 아틀리에 감성에 가까운 테마
- default-light와 감성 차이는 충분하지만, 상태 의미색과 업무 데이터 대비는 계속 확인 필요

### cold-winter

- 차가운 블루 그레이 계열
- 0.12.14에서 default-light와 구분이 더 보이도록 배경/surface/border 계열을 보정
- 흰색 계열 화면에서 카드 경계와 배경 차이가 충분한지 계속 확인 필요

## 0.12.18 추가 후보

### black-and-white

성격:
- 고대비 라이트 테마
- 색상 분위기보다 명도 대비, 경계선, 텍스트 가독성 확인이 목적

확인할 화면:
- 작업지시서 목록 row 구분
- 모달 section 경계
- 저장소/휴지통 table row
- 통계 chart tooltip과 card boundary
- 시스템관리자 purge/danger action 영역

주의:
- status success/warning/danger는 흑백화하지 않는다.
- 업무 상태 의미색은 theme 분위기색과 분리해서 유지한다.

### soft-emerald

성격:
- default-light보다 emerald accent를 더 분명하게 적용한 라이트 테마
- PeaceByPiece 기본 accent 계열을 실제 화면 전반으로 확장할 수 있는지 확인하는 목적

확인할 화면:
- 관리자 홈 action/card tone
- 작업지시서 editable/selectable/calculated field tone
- 개인 설정 theme preview
- 저장소 progress/action tone
- 통계 chart accent tone

주의:
- default-light와 너무 가까우면 배경/surface/border 계열을 더 emerald 방향으로 조정한다.
- 상태 의미색과 accent color가 충돌하지 않는지 확인한다.

## 보류 후보

### atelier-night

- dark theme 후보
- 현재 일부 화면에 직접 `bg-white`, `text-stone-*` class가 아직 남아 있을 수 있어 즉시 실사용 후보로 넣기에는 위험하다.
- dark theme는 직접 색상 class 정리가 더 끝난 후 별도 버전에서 추가하는 것이 안전하다.

## 회귀 확인 기준

1. `/me/settings`에서 5개 테마가 모두 표시되어야 한다.
2. theme 선택 후 새로고침해도 선택값이 유지되어야 한다.
3. 영어/한국어 전환 후 hydration error가 재발하지 않아야 한다.
4. `default-light`, `cold-winter`, `black-and-white`는 서로 배경과 카드 경계 차이가 육안으로 구분되어야 한다.
5. `soft-emerald`는 default-light보다 emerald accent가 더 분명해야 한다.
6. danger/warning/success 의미색은 테마 분위기색과 독립적으로 유지되어야 한다.
7. theme 추가는 DB/R2/첨부/메모/휴지통/purge 흐름에 영향을 주지 않아야 한다.

## 다음 판단

0.12.19 responsive/mobile/tablet 회귀 테스트에서 5개 테마를 함께 확인한다. 그 결과에 따라 다음 중 하나를 선택한다.

- black-and-white 유지
- soft-emerald 유지
- cold-winter 배경/surface 추가 보정
- atelier-night dark theme는 보류 유지
- 후보 테마 수를 줄여 실사용 3개 + 테스트용 2개 구조로 분리
