# 0.20.27 모바일 공통 Shell 정리

## 목표

모바일 화면별로 상단 구조, 하단 고정 액션바, safe-area 여백, 본문 패딩을 각각 다시 만들지 않도록 공통 Shell 기준을 추가했다.

## 적용 범위

- `components/common/ui/WaflMobileShell.tsx` 추가
- `components/common/ui/index.ts` export 추가
- `components/workorder/layout/MobileSectionStack.tsx`가 공통 Shell을 사용하도록 보정
- `lib/constants/version.ts`를 `0.20.27`로 갱신

## 공통화한 항목

- `WaflMobileShell`
  - 모바일 페이지 외곽 shell
  - topBar / drawer / actionBar slot 제공
  - safe-area 기반 하단 여백을 공통 적용

- `WaflMobileContentSection`
  - 모바일 본문 section 기본 overflow 방지

- `WaflMobileFixedActionBar`
  - 하단 고정 액션바
  - safe-area bottom padding 공통 적용

- `WAFL_MOBILE_SAFE_AREA_CLASS_NAMES`
  - top/bottom/content/sheet 여백 class name 상수화

## 리팩토링 원칙

- 화면별 모바일 shell 중복 생성 금지
- 화면별 하단 고정바 중복 구현 금지
- safe-area class 하드코딩 최소화
- 기존 `AppSheet` 재사용
- R2/첨부/메모/저장/상태전환 로직 변경 없음

## 다음 적용 후보

1. 작업지시서 모바일 상세 탭 구조
2. 환경설정 모바일 drawer/list 구조
3. 멤버관리 모바일 카드 구조
4. 원단·부자재 발주 모바일 상세/할당 구조

## 테스트 포인트

- 모바일 작업지시서 화면에서 상단바 표시 유지
- 작업지시서 목록 drawer 기존 동작 유지
- 하단 `첨부 · 메모` 버튼 기존 동작 유지
- 하단 sheet 열기/닫기 유지
- PC/태블릿 화면 영향 없음

