# 0.9.2212 — 관리자 통계 화면 문구 정리 및 빌드 오류 수정

## 목적
관리자 통계 화면에서 안내 문구와 개발자용 표현이 과하게 노출되어 화면 이해를 방해하는 문제를 줄인다. 0.9.2211 빌드에서 발견된 작업지시서 발주 정보 empty copy 누락도 함께 수정한다.

## 변경 내용

### 통계 화면 문구 정리
- 상단 설명 문구를 제거하고 제목/필터/요금제 선택 중심으로 정리한다.
- 선택 요금제 안내 카드를 제거해 화면 흐름을 짧게 만든다.
- Basic 차트 카드에서 source description을 제거한다.
- Standard/Growth/Premium 영역의 설명 문구를 축소한다.
- Standard preview 카드에서 feature key 표시를 제거한다.
- Premium 준비 상태 카드는 next action 중심으로 표시한다.

### 빌드 오류 수정
- `OrderInfoSection.tsx`에서 사용하는 `copy.empty`에 대응하도록 `lib/i18n/ko/workorder.ts`와 `lib/i18n/en/workorder.ts`의 `orderInfo` copy에 `empty` 항목을 추가한다.

## SQL DDL 필요 여부
불필요.

## 전체 리셋 필요 여부
불필요.

## 테스트
1. `npm run build` 실행
2. `/admin/dashboard`에서 안내 문구가 줄어든 것을 확인
3. `/worker` 작업지시서 상세의 발주 정보 빈 상태가 정상 표시되는지 확인
4. `APP_VERSION`이 `0.9.2212`인지 확인
