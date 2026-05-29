# UI Card Variant 정리 - 0.18.10

## 목적

AppCard의 variant 이름을 제품화 기준으로 정리하고 AdminCard가 AppCard variant를 명시적으로 사용하도록 연결했다.

## AppCard variant 기준

- `surface`: 기본 카드 표면
- `elevated`: 강조 카드 또는 상위 요약 카드
- `flat`: 표/목록 내부의 낮은 위계 카드
- `interactive`: 클릭 가능한 카드
- `compact`: 좁은 정보 카드
- `subtle`: 보조 배경 카드

## 호환 유지

- 기존 `default` variant는 `surface`와 같은 스타일로 유지했다.
- 기존 `subtle`, `compact`, `flat` 사용처도 그대로 동작한다.

## AdminCard 연결

- `components/admin/layout/AdminCard.tsx`
  - AdminSurfaceVariant를 AppCardVariant로 매핑한다.
  - 기존 admin surface class는 유지하고, AppCard variant만 명시화했다.

- `components/admin/common/AdminSection.tsx`
  - 내부 AdminCard에서 AppCard variant를 받을 수 있게 확장했다.

## 변경하지 않은 영역

- DB/API/R2/첨부/메모/휴지통/purge 흐름은 변경하지 않았다.
- 화면별 대량 class 정리는 후속 버전에서 진행한다.
