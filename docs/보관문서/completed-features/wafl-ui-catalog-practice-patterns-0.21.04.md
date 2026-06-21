# WAFL UI Catalog 0.21.04

## 목표

`/ui` 카탈로그에 실제 업무 화면에서 반복되는 실무 패턴 샘플을 연결한다.

## 변경 내용

- `Next patterns` placeholder를 `Practice patterns` 섹션으로 교체했다.
- 작업지시서 구성 카드 샘플을 추가했다.
  - 첨부 추가: `WaflAddCardButton`
  - 제작 공정 선택: `WaflSurfaceButton`
  - 원단/부자재 카드: `WaflSurface`
  - 카드 내부 안내: `WaflInfoBox`
- 원단·부자재 발주 row 샘플을 추가했다.
  - 발주 대기/발주 완료 상태는 `AppBadge`로 표시한다.
  - 클릭 가능한 발주 row는 `WaflSurfaceButton`으로 표현한다.
- 저장소/휴지통 row와 상세 모달 내부 구성 샘플을 추가했다.
  - 파일 row: `WaflSurfaceButton`
  - 상세 정보: `WaflInfoRow`
  - 상세 안내: `WaflInfoBox`
  - footer 액션: `WaflButton`
- 실무 패턴 선택 규칙을 추가했다.

## 의도

기존 `/ui`는 공통 컴포넌트의 형태를 확인하는 성격이 강했다. 이번 버전부터는 실제 업무 화면에서 어떤 조합으로 써야 하는지 확인할 수 있게 한다.

## 운영 상태

- `/ui` 접근 제한 임시 해제 상태 유지
- WAFL debug outline 비활성 상태 유지
- 기존 업무 화면 로직 변경 없음
