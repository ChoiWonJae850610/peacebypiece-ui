# 작업지시서 semantic token 적용 범위 회귀 점검 — 0.11.99

## 목적

0.11.92부터 0.11.98까지 작업지시서 화면에 적용한 semantic token 범위를 정리하고, theme file 분리 전에 남은 적용 영역을 분리한다.

이번 버전은 시각 톤을 크게 바꾸지 않고 적용 범위와 후속 보정 대상을 명확히 한다.

## 이미 semantic token 기준이 들어간 영역

- 작업지시서 좌측 목록 카드
- 작업지시서 선택 카드
- workflow 상태 뱃지
- 작업지시서 생성 버튼
- 검색 input
- 상태 필터 select
- 정렬 select
- 검색/필터/정렬 초기화 버튼
- 발주정보 입력 가능/선택 가능/계산 필드
- 생산구성 PC/tablet 입력 가능/선택 가능/계산 필드
- 생산구성 mobile 입력 가능/선택 가능/계산 패널
- 작업 메모 입력/등록/수정/삭제 일부 tone
- 우측 디자인/첨부/메모 카드
- 디자인 없음/첨부 없음/메모 없음 empty state
- 모바일 모달 focus 유지 보정

## 남은 적용 후보

### 1. 기본정보 수정 modal

카테고리 1/2/3, 요약 preview 영역이 아직 기존 stone 계열 직접 class를 많이 사용한다.

권장 token:

- `field.selectable`
- `field.readonly`
- `surface.card`

### 2. workflow action section

검토 요청, 검토 완료, 발주 요청, 검수 완료 등 단계 버튼과 현재 단계 dot tone이 기존 색상 class를 일부 유지한다.

권장 token:

- `action.primary`
- `action.secondary`
- `status.*`
- `feedback.focusRing`

### 3. 비용 요약 카드

비용 요약 카드와 세부 합계 영역은 아직 카드 tone이 기존 stone 계열로 남아 있다.

권장 token:

- `surface.cardMuted`
- `field.calculated`
- `text.secondary`

### 4. header/detail summary card

작업지시서 상단 상세 요약, tablet/mobile header section 일부가 기존 white/stone tone을 유지한다.

권장 token:

- `surface.card`
- `surface.cardMuted`
- `text.primary`
- `text.secondary`

### 5. theme file 분리

현재 semantic class와 CSS 변수는 `app/globals.css` 중심으로 정의되어 있다. 이후 프로젝트 전체 테마 전환을 위해 실제 theme set 파일 분리가 필요하다.

권장 구조:

```text
lib/theme/
  themeTypes.ts
  semanticThemeTokens.ts
  themes/
    defaultLight.ts
    beigeAtelier.ts
    coldWinter.ts
    blackAndWhite.ts
  resolveTheme.ts
```

## 회귀 확인 항목

- 좌측 선택 카드가 과도한 border/shadow로 보이지 않는지 확인
- 입력 가능 field가 버튼처럼 보이지 않는지 확인
- 선택 가능 field가 입력 field와 구분되되 같은 계열로 보이는지 확인
- 계산 field가 사용자가 직접 수정하는 영역처럼 보이지 않는지 확인
- 모바일 생산구성 카드가 너무 복잡해 보이지 않는지 확인
- 모바일 모달 검색 input focus가 한글 입력 중 유지되는지 확인

## 다음 권장 작업

0.12.0에서 theme file 구조를 1차 분리하는 것이 적절하다. 단, 실제 개인 환경설정 UI와 연결하기 전에 작업지시서 화면에서 token 누락 영역을 한 번 더 좁히는 편이 안전하다.
