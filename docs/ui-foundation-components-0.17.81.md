# WAFL UI foundation components 0.17.81

## 목적

0.17.81은 shadcn/ui와 Radix 계열 라이브러리를 화면 파일에 직접 확산시키기 전에 WAFL 내부 공통 UI 래퍼를 먼저 만든 버전이다.

화면에서는 외부 라이브러리 컴포넌트를 직접 쓰지 않고, 가능한 한 `components/common/ui`의 WAFL 래퍼를 사용한다.

## 추가한 내부 UI 래퍼

- `AppButton`
  - variant: `primary`, `secondary`, `ghost`, `danger`
  - size: `sm`, `md`, `lg`
  - width: `auto`, `full`
  - `@radix-ui/react-slot` 기반 `asChild` 지원

- `AppBadge`
  - tone: `neutral`, `strong`, `success`, `warning`, `danger`, `brand`
  - size: `sm`, `md`

- `AppCard`
  - variant: `default`, `compact`, `flat`, `subtle`
  - padding: `none`, `sm`, `md`, `lg`

- `AppSection`
  - 카드 기반 섹션 래퍼
  - title, description, action, body 영역 분리

- `AppListRow`
  - 목록 row/card용 공통 래퍼
  - title, description, meta, leading, trailing, selected 구조

- `AppSeparator`
  - horizontal/vertical 구분선 공통 래퍼

## 공통 유틸 변경

`lib/utils.ts`의 `cn`을 단순 join 방식에서 `clsx` + `tailwind-merge` 조합으로 변경했다.

목적:

- 조건부 class 처리 안정화
- Tailwind class 충돌 병합
- shadcn/ui 계열 class composition 준비

## 적용 원칙

1. 작업지시서/원단·부자재 화면에 외부 라이브러리 컴포넌트를 직접 넣지 않는다.
2. 먼저 WAFL 래퍼를 적용하고, 필요 시 래퍼 내부 구현만 교체한다.
3. PC/tablet/mobile 레이아웃 구조는 화면별 wrapper에서 분리한다.
4. 공통 로직/저장/계산은 공유하되, 레이아웃과 정보 노출량은 디바이스별로 분리한다.
5. 기존 동작이 안정적인 저장/발주/첨부/R2/휴지통 흐름은 UI 래퍼 적용 과정에서 건드리지 않는다.

## 다음 적용 후보

0.17.82부터 다음 순서로 적용한다.

1. 작업지시서 목록 카드
2. 작업지시서 상세 상단 요약/섹션
3. 원단·부자재 발주서 목록
4. 원단·부자재 후보 작업지시서 목록
5. 관리자/시스템 화면 공통 카드/배지

## 주의

이번 버전은 기반 컴포넌트 생성이 목적이며, 주요 화면의 시각 구조를 대량 변경하지 않는다.
