# 0.11.80 작업지시서 발주정보 총 금액 요약 실제 표시 보정

## 목적

0.11.79에서 발주정보 총 금액 계산/포맷 함수는 추가되었지만, PC 발주정보 섹션의 실제 summary 렌더링 경로에는 연결되지 않았다.

이번 버전에서는 `OrderInfoSection`이 직접 조립하던 발주정보 요약 문자열을 공통 `formatOrderSummary`로 교체해 화면 상단 요약 줄에 총 금액이 표시되도록 보정한다.

## 표시 위치

발주정보 섹션 제목 아래 summary 줄:

```text
2건 · 200장 · 검수 완료 0/2 · 총 671,000원
```

## 계산 기준

- 각 발주 행: `수량 × 공임비 + 로스비`
- 전체 발주정보 총액: 모든 발주 행의 합계

## 변경 범위

- `components/workorder/detail/sections/OrderInfoSection.tsx`
  - 발주정보 summary를 공통 `formatOrderSummary(orderEntries, i18n)`로 연결
- `lib/constants/app.ts`
  - APP_VERSION 0.11.80 반영

## 제외 범위

- DB schema 변경 없음
- 발주정보 저장 구조 변경 없음
- 비용 요약 카드 계산 로직 변경 없음
- 모바일/태블릿 발주정보 섹션은 이미 공통 `formatOrderSummary`를 사용하므로 직접 변경하지 않음

## 테스트

1. `/worker` 진입
2. 발주정보 섹션 펼침
3. 제목 아래 요약 줄에 `총 n원` 표시 확인
4. 발주 수량, 공임비, 로스비 변경 후 summary 금액 갱신 확인
5. 모바일/태블릿 발주정보 summary 기존 표시 유지 확인
