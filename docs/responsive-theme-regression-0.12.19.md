# PeaceByPiece 0.12.19 responsive/mobile/tablet theme 회귀 테스트 기준

## 목적

0.12.11~0.12.18에서 작업지시서, 관리자, 저장소, 통계, 시스템관리자, 개인 설정 화면의 theme token 적용 범위가 넓어졌다. 이 문서는 다음 기능 추가 전에 PC / tablet / mobile에서 theme 전환으로 UI가 깨지는 영역을 수동 점검하기 위한 기준이다.

## 적용 범위

- `/worker` 작업지시서 화면
- `/me/settings` 개인 설정 화면
- `/admin` 관리자 홈
- `/admin/settings` 환경설정
- `/admin/members` 멤버관리
- `/admin/files` 저장소 관리
- `/admin/dashboard` 통계 화면
- `/system` 시스템관리자 홈
- `/system/storage-usage` 저장소 실제 삭제 후보
- `/system/companies` 고객사 승인
- `/system/category-rules` 분류 규칙

## Theme 후보

현재 회귀 대상 theme는 다음 5개다.

1. `default-light`
2. `beige-atelier`
3. `cold-winter`
4. `black-and-white`
5. `soft-emerald`

`atelier-night` 같은 dark theme는 직접 색상 class 잔여와 상태 의미색 대비를 더 정리한 뒤 도입한다.

## Breakpoint 기준

### Mobile

권장 확인 폭:

- 360px
- 390px
- 430px

확인 항목:

- 작업지시서 상단 home / 개인 설정 아이콘이 겹치지 않는지
- 작업지시서 목록 검색/필터/정렬 영역이 과밀하지 않은지
- 생산구성 mobile card의 입력 가능 / 선택 가능 / 계산 field tone이 과하지 않은지
- 공통 modal의 상단 고정 닫기 버튼이 항상 보이는지
- modal 내부 scroll이 body scroll과 충돌하지 않는지
- `/me/settings` theme 선택 카드의 tap target이 충분한지
- 영어로 전환 후 새로고침 시 hydration error가 재발하지 않는지

### Tablet

권장 확인 폭:

- 768px
- 820px
- 1024px

확인 항목:

- 작업지시서 생산구성 table 가로 스크롤이 유지되는지
- 작업지시서 header / 비용 요약 card가 어색하게 찢어지지 않는지
- 관리자 홈 카드 grid가 2열 또는 3열에서 균형 있게 보이는지
- 저장소 table header와 row hover/selected tone이 구분되는지
- 통계 chart card의 label, tooltip, empty state가 theme와 충돌하지 않는지

### PC

권장 확인 폭:

- 1280px
- 1440px
- 1728px 이상

확인 항목:

- 작업지시서 sidebar / detail / right panel의 surface hierarchy가 구분되는지
- 관리자 홈, 저장소, 통계, 시스템관리자 화면의 card/table/background depth가 theme마다 충분히 다른지
- `black-and-white`가 너무 강한 border 때문에 피로하지 않은지
- `soft-emerald`가 default-light와 충분히 구분되는지
- `cold-winter`가 default-light와 충분히 구분되는지

## 모달 회귀 기준

모달은 공통 shell을 유지한다. 개별 modal content 점검 기준은 다음과 같다.

- 배경 scroll lock 유지
- focus trap 유지
- Escape 닫기 유지
- mobile 상단 고정 닫기 버튼 유지
- warning / danger / empty state는 theme 분위기가 아니라 의미색 기준 유지
- preview 또는 인쇄 문서형 영역은 필요한 경우 고정 white 계열을 허용

## 판단 기준

### 즉시 수정 대상

- 텍스트 대비가 낮아 읽기 어려운 경우
- mobile에서 버튼/field가 겹치는 경우
- modal close button이 viewport 밖으로 밀리는 경우
- theme 전환 후 기존 선택 상태가 사라진 것처럼 보이는 경우
- 영어 설정 새로고침에서 hydration error가 재발하는 경우

### 보류 가능 대상

- 색상 취향 수준의 미세 조정
- chart palette 세부 조정
- dark theme 도입
- DB 저장형 개인 설정 구현

## 다음 버전 연결

0.12.20 작업지시서 직접 그리기 기능 설계 전에 이 기준을 유지한다. drawing modal은 tablet/touch 사용성이 중요하므로, modal shell / scroll / close / field tone 기준을 이 문서와 맞춘다.
